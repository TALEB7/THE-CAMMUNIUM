import numpy as np
from typing import List


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Cosine similarity between two vectors, bounded to [-1, 1].

    Normalizes both vectors by their L2 norm so the result is a true cosine
    regardless of whether the inputs were pre-normalized. The final clip only
    guards against tiny floating-point overshoot (e.g. 1.0000001).
    """
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    cosine = np.dot(va, vb) / (norm_a * norm_b)
    return float(np.clip(cosine, -1.0, 1.0))


def find_top_k_similar(
    query_embedding: List[float],
    candidates: List[dict],
    top_k: int = 5,
    exclude_id: str = None,
) -> List[dict]:
    """
    Returns top_k candidates sorted by cosine similarity descending.
    Each candidate: {"id": str, "embedding": List[float]}
    Returns: [{"id": str, "score": float}]
    """
    scored = []
    for candidate in candidates:
        if exclude_id and candidate["id"] == exclude_id:
            continue
        score = cosine_similarity(query_embedding, candidate["embedding"])
        scored.append({"id": candidate["id"], "score": round(score, 4)})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]
