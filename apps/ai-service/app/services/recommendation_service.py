"""
Personalized Listing Recommendations — Maximal Marginal Relevance (MMR).

Why MMR instead of plain top-K cosine?
───────────────────────────────────────
Plain top-K returns the 20 most similar listings to the user's taste vector.
Problem: if the user liked 3 iPhone listings, all 20 results will be iPhones.

MMR balances relevance AND diversity at each selection step:

    score(c) = (1 - λ) × sim(c, user_taste)
             - λ       × max_{s ∈ selected} sim(c, s)

λ = 0 → pure relevance (same as top-K cosine)
λ = 1 → pure diversity (ignore user taste, maximise spread)
λ = 0.3 → 70% relevance, 30% diversity  ← our default

This is the same algorithm used in Google's Diversified Search,
Spotify's Discover Weekly, and Pinterest's home feed.

Reference: Carbonell & Goldstein, 1998 — "The Use of MMR, Diversity-Based
           Reranking for Reordering Documents and Producing Summaries"
"""
import logging
from typing import List

import numpy as np

logger = logging.getLogger(__name__)


def _cosine_matrix(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """
    Compute cosine similarity between every row of a and every row of b.
    Vectors must already be L2-normalised (unit norm).
    Returns shape (len(a), len(b)).
    """
    return a @ b.T


def recommend_for_user(
    user_embedding: List[float],
    candidates: List[dict],           # [{"listing_id": str, "embedding": List[float]}]
    top_k: int = 20,
    diversity_lambda: float = 0.4,
) -> List[dict]:
    """
    Returns up to top_k recommendations sorted by MMR score (descending).

    Each result dict: {listing_id, relevance_score, diversity_score, final_score}

    diversity_score is **inverted**: 1.0 = very diverse (unique), 0.0 = clone
    of an already-selected item.  Internally MMR still penalises by raw
    similarity; the inversion is applied only on the returned score.
    """
    if not candidates:
        return []

    top_k = min(top_k, len(candidates))

    user_vec = np.array(user_embedding, dtype=np.float32)
    # Ensure user vector is unit-norm
    norm = np.linalg.norm(user_vec)
    if norm > 0:
        user_vec = user_vec / norm

    ids = [c["listing_id"] for c in candidates]
    vecs = np.array([c["embedding"] for c in candidates], dtype=np.float32)  # (N, D)

    # L2-normalise candidate vectors (defensive — model should already do this)
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    vecs = vecs / norms

    # Relevance scores: sim(candidate, user_taste)  shape: (N,)
    relevance = vecs @ user_vec

    # Pairwise similarity matrix for diversity  shape: (N, N)
    pairwise = _cosine_matrix(vecs, vecs)

    selected_indices: List[int] = []
    remaining = list(range(len(ids)))

    results: List[dict] = []

    for _ in range(top_k):
        if not remaining:
            break

        best_idx = None
        best_score = -np.inf
        best_diversity = 0.0

        for idx in remaining:
            rel = float(relevance[idx])

            if not selected_indices:
                div = 0.0
            else:
                div = float(np.max(pairwise[idx, selected_indices]))

            mmr = (1 - diversity_lambda) * rel - diversity_lambda * div

            if mmr > best_score:
                best_score = mmr
                best_idx = idx
                best_diversity = div

        selected_indices.append(best_idx)
        remaining.remove(best_idx)

        results.append({
            "listing_id":      ids[best_idx],
            "relevance_score": round(float(relevance[best_idx]), 4),
            "diversity_score": round(1.0 - best_diversity, 4),  # 1.0 = unique, 0.0 = clone
            "final_score":     round(best_score, 4),
        })

    logger.info(
        "MMR recommendations: %d candidates → top-%d "
        "(λ=%.2f, best_rel=%.4f, best_final=%.4f)",
        len(candidates), len(results), diversity_lambda,
        results[0]["relevance_score"] if results else 0,
        results[0]["final_score"] if results else 0,
    )
    return results
