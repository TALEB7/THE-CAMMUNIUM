"""
Dynamic Price Suggestion — statistical engine.

Two-tier strategy:
  1. If comparable_prices is non-empty (≥3 data points): IQR-filtered
     percentile model with condition adjustment.
  2. Fallback (cold start / no comparables): condition-only heuristic that
     returns a wide confidence band.

Design notes
────────────
• We never hard-code category-specific prices — those belong in the DB.
• Condition multipliers are empirically derived from second-hand market
  research; they can be overridden by the caller.
• The method field lets the caller display "estimated" vs "data-driven"
  to the end user.
"""
import logging
import statistics
from typing import List

logger = logging.getLogger(__name__)

# Condition multipliers relative to "GOOD" baseline (= 1.0)
CONDITION_MULTIPLIERS = {
    "NEW":       1.30,
    "LIKE_NEW":  1.15,
    "GOOD":      1.00,
    "FAIR":      0.78,
    "POOR":      0.55,
}

# Aliases for condition labels coming from the frontend / DB (e.g. "used_good").
# Mapped onto the canonical keys of CONDITION_MULTIPLIERS.
_CONDITION_ALIASES = {
    "NEW":        "NEW",
    "USED_LIKE_NEW": "LIKE_NEW",
    "LIKE_NEW":   "LIKE_NEW",
    "USED_GOOD":  "GOOD",
    "GOOD":       "GOOD",
    "USED_FAIR":  "FAIR",
    "FAIR":       "FAIR",
    "USED_POOR":  "POOR",
    "POOR":       "POOR",
}

# Minimum number of data points to trust the statistical path
_MIN_SAMPLES = 3


def _normalize_condition(condition: str) -> str:
    """Map any condition label (e.g. 'used_good') to a canonical key."""
    key = (condition or "").strip().upper()
    return _CONDITION_ALIASES.get(key, "GOOD")


def _age_depreciation(age_months: int) -> float:
    """Smooth depreciation factor in (0, 1] driven by item age.

    Uses a hyperbolic decay (~2%/month early on, with diminishing effect later
    and a 0.20 floor so very old items never collapse to ~0). Examples:
      0 mo → 1.00, 12 mo → 0.67, 24 mo → 0.50, 48 mo → 0.33.
    """
    if not age_months or age_months <= 0:
        return 1.0
    factor = 1.0 / (1.0 + age_months / 24.0)
    return max(factor, 0.20)


def _percentile(data: List[float], pct: float) -> float:
    """Linear interpolation percentile (no numpy dependency)."""
    sorted_d = sorted(data)
    n = len(sorted_d)
    if n == 1:
        return sorted_d[0]
    idx = (pct / 100) * (n - 1)
    lo_i = int(idx)
    hi_i = min(lo_i + 1, n - 1)
    frac = idx - lo_i
    return sorted_d[lo_i] * (1 - frac) + sorted_d[hi_i] * frac


def _iqr_filter(prices: List[float]) -> List[float]:
    """Remove outliers beyond 1.5 × IQR from Q1/Q3.

    Uses interpolated percentiles for Q1/Q3 instead of crude integer indexing
    (the old ``sorted_p[n // 4]`` was badly biased for small samples).
    """
    q1 = _percentile(prices, 25)
    q3 = _percentile(prices, 75)
    iqr = q3 - q1
    lo = q1 - 1.5 * iqr
    hi = q3 + 1.5 * iqr
    filtered = [p for p in prices if lo <= p <= hi]
    return filtered if filtered else sorted(prices)   # safety: never return empty


def suggest_price(
    condition: str,
    comparable_prices: List[float],
    original_price: float = None,
    age_months: int = None,
) -> dict:
    """
    Returns a dict with keys: min_price, max_price, recommended_price,
    confidence, method.
    """
    condition = _normalize_condition(condition)
    multiplier = CONDITION_MULTIPLIERS.get(condition, 1.0)

    # ── Path A: statistical (≥ MIN_SAMPLES comparables) ────────────
    if len(comparable_prices) >= _MIN_SAMPLES:
        clean = _iqr_filter(comparable_prices)

        p20 = _percentile(clean, 20)
        p50 = _percentile(clean, 50)
        p80 = _percentile(clean, 80)

        # Apply condition adjustment to the market range
        min_price  = round(p20 * multiplier, 2)
        recommended = round(p50 * multiplier, 2)
        max_price  = round(p80 * multiplier, 2)

        # Confidence: more data → higher confidence, capped at 0.95
        n = len(clean)
        confidence = round(min(0.95, 0.50 + 0.05 * n), 2)

        # Coefficient of variation as a quality signal
        if len(clean) >= 2:
            cv = statistics.stdev(clean) / (statistics.mean(clean) + 1e-9)
            if cv > 0.5:   # high dispersion → lower confidence
                confidence = round(confidence * 0.8, 2)

        logger.info(
            "Price suggestion (statistical): p20=%.2f p50=%.2f p80=%.2f "
            "condition=%s multiplier=%.2f confidence=%.2f",
            p20, p50, p80, condition, multiplier, confidence,
        )
        return {
            "min_price": max(min_price, 1.0),
            "max_price": max(max_price, min_price + 1),
            "recommended_price": max(recommended, 1.0),
            "confidence": confidence,
            "method": "statistical",
        }

    # ── Path B: heuristic fallback (cold start) ─────────────────────
    # Priority of base price for the band:
    #   1. original (retail/new) price, depreciated by age + condition
    #   2. a single comparable price (condition-adjusted)
    #   3. truly cold → low-confidence placeholder band
    if original_price and original_price > 0:
        depreciation = _age_depreciation(age_months)
        adjusted = original_price * depreciation * multiplier
        min_price  = round(adjusted * 0.75, 2)
        recommended = round(adjusted, 2)
        max_price  = round(adjusted * 1.25, 2)
        confidence = 0.45
        method = "heuristic_depreciation"
        logger.info(
            "Price suggestion (heuristic/depreciation): original=%.2f age=%s "
            "depreciation=%.3f condition_mult=%.2f → rec=%.2f",
            original_price, age_months, depreciation, multiplier, recommended,
        )
    elif comparable_prices and comparable_prices[0] > 0:
        adjusted = comparable_prices[0] * multiplier
        min_price  = round(adjusted * 0.75, 2)
        recommended = round(adjusted, 2)
        max_price  = round(adjusted * 1.25, 2)
        confidence = 0.35
        method = "heuristic_single"
    else:
        # Truly cold — return a structurally valid but low-confidence result
        min_price  = 1.0
        recommended = 1.0
        max_price  = 1.0
        confidence = 0.10
        method = "heuristic_cold"

    logger.info(
        "Price suggestion (heuristic/%s): condition=%s confidence=%.2f",
        method, condition, confidence,
    )
    return {
        "min_price": min_price,
        "max_price": max_price,
        "recommended_price": recommended,
        "confidence": confidence,
        "method": method,
    }
