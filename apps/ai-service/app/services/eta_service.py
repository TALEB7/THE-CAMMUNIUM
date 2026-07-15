"""
ETA Prediction — feature-engineered regression for marketplace delivery time.

Simulates what a trained LightGBM/scikit-learn regressor would learn from
historical delivery data. Until real labels are available this statistical
model is the production-ready baseline.

Features
────────
1. category_speed    — item type determines base handling + shipping time
2. city_tier         — major vs secondary vs remote Moroccan cities
3. distance_zone     — same-city express vs inter-city standard shipping
4. condition_factor  — new items ship faster (no pre-shipping inspection)
5. seller_experience — proven sellers have faster processing times
6. time_of_day       — orders placed after business hours start next-day
7. day_of_week       — weekend orders are delayed to Monday pickup

Output
──────
    eta_minutes : int   — canonical output (matches DTO field)
    eta_hours   : float — human-readable
    eta_days    : int   — ceil(eta_hours / 24), useful for UI badges
    confidence  : float — [0, 1] — degrades with missing/unknown inputs
    breakdown   : dict  — explainability for each factor
"""

import math
from typing import Optional

# ── City tiers (Morocco) ──────────────────────────────────────────────────────
_TIER_1 = {
    "casablanca", "rabat", "marrakech", "fes", "fez", "tanger", "tangier",
    "agadir", "meknes", "oujda", "kenitra", "salé", "sale", "temara",
}
_TIER_2 = {
    "tetouan", "safi", "el jadida", "beni mellal", "nador", "settat",
    "khouribga", "taza", "berrechid", "mohammedia", "laayoune", "dakhla",
    "errachidia", "ouarzazate",
}

def _city_tier(city: Optional[str]) -> int:
    if not city:
        return 3
    normalized = city.strip().lower()
    if normalized in _TIER_1:
        return 1
    if normalized in _TIER_2:
        return 2
    return 3


# ── Category → base handling hours ───────────────────────────────────────────
# Represents how quickly a seller can prepare and hand off the item.
_CATEGORY_BASE: dict[str, float] = {
    # Instant / digital
    "services":           0.5,
    "digital":            0.5,
    "formation":          1.0,
    "cours":              1.0,
    # Fast (electronics, clothing)
    "téléphones":         8.0,
    "telephones":         8.0,
    "informatique":       8.0,
    "électronique":       8.0,
    "electronique":       8.0,
    "vêtements":         12.0,
    "vetements":         12.0,
    "mode":              12.0,
    "accessoires":       12.0,
    "chaussures":        12.0,
    "livres":            16.0,
    "jeux vidéo":        16.0,
    "jeux video":        16.0,
    # Medium
    "sport":             24.0,
    "maison":            24.0,
    "décoration":        24.0,
    "decoration":        24.0,
    "jardin":            24.0,
    "électroménager":    24.0,
    "electromenager":    24.0,
    "animaux":           24.0,
    # Slow (large / fragile)
    "mobilier":          48.0,
    "meubles":           48.0,
    "immobilier":        48.0,
    # Very slow (vehicles, machinery)
    "voitures":          72.0,
    "motos":             72.0,
    "vélos":             48.0,
    "velos":             48.0,
}
_DEFAULT_BASE_HOURS = 20.0


def _category_base_hours(category_name: Optional[str]) -> tuple[float, str]:
    if not category_name:
        return _DEFAULT_BASE_HOURS, "unknown"
    key = category_name.strip().lower()
    # Try exact match first, then partial
    if key in _CATEGORY_BASE:
        return _CATEGORY_BASE[key], key
    for k, v in _CATEGORY_BASE.items():
        if k in key or key in k:
            return v, k
    return _DEFAULT_BASE_HOURS, "default"


# ── Distance multiplier ───────────────────────────────────────────────────────
_DISTANCE_MATRIX: dict[tuple[int, int], float] = {
    (1, 1): 1.3,   # inter-city tier1 → tier1: express next-day possible
    (1, 2): 1.8,
    (1, 3): 2.8,
    (2, 1): 1.8,
    (2, 2): 2.2,
    (2, 3): 3.2,
    (3, 1): 2.8,
    (3, 2): 3.2,
    (3, 3): 4.5,
}


def _distance_multiplier(
    seller_city: Optional[str],
    buyer_city: Optional[str],
    seller_tier: int,
    buyer_tier: Optional[int],
) -> tuple[float, str]:
    if buyer_tier is None:
        # Assume average buyer = tier 1 (most buyers are in major cities)
        buyer_tier = 1

    # Same city → local / express delivery
    if (
        seller_city
        and buyer_city
        and seller_city.strip().lower() == buyer_city.strip().lower()
    ):
        return 1.0, "same_city"

    # Different cities — use the tier-based distance matrix
    mult = _DISTANCE_MATRIX.get((seller_tier, buyer_tier), 3.0)
    zone = f"tier{seller_tier}_to_tier{buyer_tier}"
    return mult, zone


# ── Condition multiplier ──────────────────────────────────────────────────────
_CONDITION_MULT: dict[str, float] = {
    "new":       1.00,
    "like_new":  1.05,
    "good":      1.15,
    "fair":      1.30,
    "poor":      1.50,
}


# ── Seller experience modifier ────────────────────────────────────────────────
def _seller_modifier(seller_listing_count: int) -> tuple[float, str]:
    if seller_listing_count >= 20:
        return 0.80, "expert_seller"
    if seller_listing_count >= 10:
        return 0.90, "experienced_seller"
    if seller_listing_count >= 5:
        return 0.95, "active_seller"
    return 1.00, "new_seller"


# ── Time-of-day delay (hours) ─────────────────────────────────────────────────
def _timing_delay(hour: int, day_of_week: int) -> tuple[float, str]:
    """
    Orders placed outside business hours (9-17 Mon–Fri) add processing delay.
    day_of_week: 0=Monday … 6=Sunday
    """
    delay = 0.0
    label_parts = []

    if 9 <= hour < 17:
        label_parts.append("business_hours")
    elif 17 <= hour < 22:
        delay += 4.0
        label_parts.append("evening_+4h")
    else:
        delay += 10.0
        label_parts.append("night_+10h")

    if day_of_week >= 5:  # Saturday or Sunday
        delay += 24.0
        label_parts.append("weekend_+24h")

    return delay, "_".join(label_parts) if label_parts else "business_hours"


# ── Main prediction function ──────────────────────────────────────────────────
def predict_eta(
    category_name: Optional[str],
    seller_city: Optional[str],
    buyer_city: Optional[str],
    condition: Optional[str],
    seller_listing_count: int,
    hour_of_day: int,
    day_of_week: int,
) -> dict:
    """
    Returns:
        eta_minutes       : int
        eta_hours         : float
        eta_days          : int
        confidence        : float [0, 1]
        breakdown         : dict
    """
    base_hours, cat_label    = _category_base_hours(category_name)
    seller_tier               = _city_tier(seller_city)
    buyer_tier_val            = _city_tier(buyer_city) if buyer_city else None
    dist_mult, dist_label     = _distance_multiplier(
        seller_city, buyer_city, seller_tier, buyer_tier_val,
    )
    cond_key                  = (condition or "good").lower()
    cond_mult                 = _CONDITION_MULT.get(cond_key, 1.15)
    seller_mod, seller_label  = _seller_modifier(seller_listing_count)
    timing_delay, timing_label = _timing_delay(hour_of_day, day_of_week)

    # Core regression formula
    eta_hours = (base_hours * dist_mult * cond_mult * seller_mod) + timing_delay
    eta_hours = max(eta_hours, 1.0)  # minimum 1 hour

    eta_minutes = int(round(eta_hours * 60))
    eta_days    = math.ceil(eta_hours / 24)

    # Confidence: degrades for missing city, unknown category
    confidence = 0.85
    if not seller_city:
        confidence -= 0.15
    if cat_label in ("unknown", "default"):
        confidence -= 0.10
    if not buyer_city:
        confidence -= 0.05
    confidence = round(max(confidence, 0.40), 2)

    return {
        "eta_minutes": eta_minutes,
        "eta_hours":   round(eta_hours, 1),
        "eta_days":    eta_days,
        "confidence":  confidence,
        "breakdown": {
            "base_hours":        base_hours,
            "category":          cat_label,
            "location_zone":     dist_label,
            "condition_factor":  f"{cond_key}_{cond_mult}x",
            "seller_experience": seller_label,
            "timing":            timing_label,
        },
    }
