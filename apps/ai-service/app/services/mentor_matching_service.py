"""
Mentor Smart Matching — hybrid scoring engine.

Scoring formula (weighted linear combination of normalised signals):
  final = w_semantic * cos_sim
        + w_rating   * norm_rating
        + w_exp      * norm_exp
        + w_sessions * norm_sessions

All input signals are min-max normalised within the candidate pool so the
composite score is always in [0, 1] and the weights are interpretable.
"""
import math
import logging
from typing import List

import numpy as np

from app.models.schemas import (
    MentorCandidate,
    MentorMatchItem,
)
from app.services.similarity_service import cosine_similarity as _cosine

logger = logging.getLogger(__name__)

_EXP_CAP = 20       # years — anything above is treated as "very experienced"
_SESSION_CAP = 200  # sessions — diminishing returns after this


def _minmax(values: np.ndarray) -> np.ndarray:
    """Min-max normalise; returns 0.5 if all values are identical."""
    lo, hi = values.min(), values.max()
    if hi == lo:
        return np.full_like(values, 0.5, dtype=np.float32)
    return (values - lo) / (hi - lo)


def _log_compress(value: float, cap: float) -> float:
    """Log-compress a raw count signal to reduce the impact of outliers."""
    return math.log1p(min(value, cap)) / math.log1p(cap)


def rank_mentors(
    query_embedding: List[float],
    candidates: List[MentorCandidate],
    top_k: int = 10,
    w_semantic: float = 0.55,
    w_rating: float = 0.25,
    w_experience: float = 0.12,
    w_sessions: float = 0.08,
) -> List[MentorMatchItem]:
    """
    Return top-k ranked mentors as MentorMatchItem objects.

    The function is intentionally stateless — all signals are normalised
    within the candidate pool passed in, making it easy to call from tests
    or a notebook without any DB access.
    """
    # Exclude unavailable mentors entirely — they must never be surfaced as a
    # match, even with a strong semantic/quality score.
    candidates = [c for c in candidates if c.is_available]
    if not candidates:
        return []

    n = len(candidates)

    # ── 1. Semantic similarity ────────────────────────────────────────
    semantic_scores = np.array(
        [_cosine(query_embedding, c.embedding) for c in candidates],
        dtype=np.float32,
    )

    # ── 2. Rating  (0–5 → [0, 1] via min-max within pool) ───────────
    raw_ratings = np.array([c.rating for c in candidates], dtype=np.float32)
    rating_scores = _minmax(raw_ratings)

    # ── 3. Experience (log-compressed, capped at _EXP_CAP years) ─────
    exp_scores = np.array(
        [_log_compress(c.years_exp, _EXP_CAP) for c in candidates],
        dtype=np.float32,
    )

    # ── 4. Proven track record (log-compressed session count) ─────────
    session_scores = np.array(
        [_log_compress(c.total_sessions, _SESSION_CAP) for c in candidates],
        dtype=np.float32,
    )

    # ── 5. Composite score ────────────────────────────────────────────
    composite = (
        w_semantic   * semantic_scores
        + w_rating   * rating_scores
        + w_experience * exp_scores
        + w_sessions * session_scores
    )

    # ── 6. Sort + take top-k ─────────────────────────────────────────
    ranked_idx = np.argsort(composite)[::-1][:top_k]

    results: List[MentorMatchItem] = []
    for i in ranked_idx:
        c = candidates[i]
        results.append(
            MentorMatchItem(
                mentor_profile_id=c.mentor_profile_id,
                score=round(float(composite[i]), 4),
                semantic_score=round(float(semantic_scores[i]), 4),
                rating_score=round(float(rating_scores[i]), 4),
                experience_score=round(float(exp_scores[i]), 4),
                sessions_score=round(float(session_scores[i]), 4),
            )
        )

    logger.info(
        "Mentor matching: %d candidates → top-%d  (best=%.4f, worst=%.4f)",
        n,
        len(results),
        results[0].score if results else 0,
        results[-1].score if results else 0,
    )
    return results
