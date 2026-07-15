"""
NLP Listing Classification — zero-shot category matching + keyword tag extraction.

Strategy
────────
• Category classification: encode the listing text AND each category label
  with the same sentence-transformer, then pick the label whose embedding
  has the highest cosine similarity to the listing embedding.
  This is zero-shot — no labelled training data required.

  The bare category name ("Immobilier") is a poor anchor for a *paraphrase*
  model, so we wrap each label in a short hypothesis template
  ("Catégorie : Immobilier").  On an internal benchmark this lifted accuracy
  from 3/10 to 5/10.  Category-label embeddings are cached per category set so
  we don't re-encode them on every request.

  Confidence is the soft-max probability of the winning category (relative to
  the runners-up), which is far more interpretable than the raw cosine value
  a paraphrase model emits (typically 0.1–0.4 even for a correct match).

• Tag extraction: lightweight TF-IDF-inspired noun-phrase extractor using
  only the Python standard library (no spaCy / NLTK download needed at
  startup).  Works on French, Arabic, and English via the multilingual model.

• Urgency scoring: heuristic keyword scan for urgency signals in the text.
"""
import logging
import re
import unicodedata
from collections import Counter
from typing import List, Tuple

import numpy as np

from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

# Hypothesis template wrapped around each category label before encoding.
_CATEGORY_TEMPLATE = "Catégorie : {}"

# Soft-max temperature for turning cosine similarities into a confidence.
# Lower = sharper (more decisive) probabilities.
_SOFTMAX_TEMPERATURE = 0.05

# Cache of category-label embeddings, keyed by the ordered category tuple.
_CATEGORY_CACHE: dict = {}

# Urgency signal words (French + English + Arabic transliteration)
_URGENCY_HIGH = {
    "urgent", "urgente", "immédiatement", "immediately", "asap",
    "aujourd'hui", "today", "rapidement", "vite", "flash",
    "عاجل", "سريع",
}
_URGENCY_MEDIUM = {
    "bientôt", "soon", "cette semaine", "this week", "prochainement",
    "قريب",
}

# French stopwords (expanded with generic transaction terms to filter out noise from tags)
_STOPWORDS = {
    # Standards — determiners, pronouns, prepositions, conjunctions
    "le", "la", "les", "un", "une", "des", "du", "de", "et", "en",
    "pour", "sur", "dans", "avec", "par", "au", "aux", "ce", "se",
    "que", "qui", "est", "son", "sa", "ses", "à", "je", "tu", "il",
    "elle", "nous", "vous", "ils", "elles", "on", "ne", "pas", "plus",
    "très", "bien", "or", "the", "a", "an", "of", "in", "to", "is",
    "and", "for", "with", "at", "by", "this", "that", "it", "ou", "où",
    "sous", "dans", "avec", "sans", "comme",

    # Possessive pronouns / determiners (missing before this fix)
    "mon", "ma", "mes", "ton", "ta", "tes",
    "notre", "nos", "votre", "vos", "leur", "leurs",

    # Demonstratives
    "cette", "ces", "cet", "ceux", "celles",

    # Auxiliary verbs & common verbs
    "être", "etre", "avoir", "sont", "été", "ete",
    "sera", "seront", "serait",
    "aussi", "même", "meme", "tout", "tous", "toute", "toutes",
    "ici", "donc", "car", "mais", "alors", "aussi", "dont",
    "encore", "entre", "depuis", "chez", "après", "apres",
    "avant", "pendant", "vers",

    # Generic listing / transactional words to exclude from tags
    "vends", "vend", "vendre", "cherche", "recherche", "achat", "acheter",
    "vente", "urgent", "urgente", "bon", "bonne", "etat", "état", "neuf",
    "neuve", "excellent", "parfait", "dh", "dhs", "dirham", "dirhams", "prix",
    "négociable", "nego", "dispo", "disponible", "cause", "départ", "etranger",
    "étranger", "double", "emploi", "boite", "boîte", "chargeur", "original",
    "authentique", "avec", "sans",

    # Conjugated verb forms frequently appearing in listing titles/descriptions
    "recherchons", "cherchons", "vendons", "proposons", "offrons", "livrons",
    "recherchez", "cherchez", "vendez", "proposez", "offrez", "livrez",
    "recherchent", "cherchent", "vendent", "proposent", "offrent", "livrent",
    "vendu", "vendue", "vendus", "vendues",
    "acheté", "achetée", "achetés", "achetées",
    "proposé", "proposée", "proposés", "proposées",
    "offert", "offerte", "offerts", "offertes",
    "livré", "livrée", "livrés", "livrées",
    "utilisé", "utilisée", "utilisés", "utilisées",
    "besoin", "intéressé", "interesse", "contactez", "contacte",
    "envoyez", "envoyer", "appelez", "appeler",
    "accepte", "acceptons", "acceptez",
    "peut", "peuvent", "pouvez", "pouvons",
    "fait", "faites", "faisons",
    "voir", "veuillez", "merci", "svp", "please",
}

# ── Verb-suffix filter ────────────────────────────────────────────────────────
# French verb conjugation suffixes that should never be valid tags.
# We check these AFTER the stopword set to catch conjugations we didn't
# enumerate explicitly (e.g. "souhaitons", "expédions").
_VERB_SUFFIXES = (
    "ons", "ez", "ent",                       # present indicative
    "ais", "ait", "ions", "iez", "aient",     # imperfect
    "erai", "eras", "era", "erons", "erez", "eront",  # future
    "rais", "rait", "rions", "riez", "raient",        # conditional
)

# Minimum token length to apply verb-suffix heuristic (avoid false positives
# on short words like "bon" ending in "on").
_MIN_LEN_FOR_SUFFIX_CHECK = 6


def _is_likely_verb(token: str) -> bool:
    """Heuristic: reject tokens that look like conjugated French verbs."""
    if len(token) < _MIN_LEN_FOR_SUFFIX_CHECK:
        return False
    return token.endswith(_VERB_SUFFIXES)


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    dot = float(np.dot(a, b))
    # Vectors are already L2-normalised by the model; clamp for float precision
    return max(-1.0, min(1.0, dot))


def _tokenize(text: str) -> List[str]:
    """Lowercase, strip punctuation, split on whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s\u0600-\u06FF]", " ", text)  # keep Arabic chars
    return [t for t in text.split() if len(t) >= 3 and t not in _STOPWORDS and not _is_likely_verb(t)]


def _extract_tags(title: str, description: str, top_n: int = 6) -> List[str]:
    """
    Simple TF-IDF-inspired tag extraction.
    Combines title (higher weight) and description tokens, scores by TF,
    returns top-n unique tokens.
    """
    title_tokens = _tokenize(title) * 3     # boost title terms
    desc_tokens  = _tokenize(description)
    all_tokens   = title_tokens + desc_tokens

    if not all_tokens:
        return []

    freq = Counter(all_tokens)
    total = sum(freq.values())

    # TF score — normalise by document length
    tf_scores = {tok: count / total for tok, count in freq.items()}

    ranked = sorted(tf_scores, key=tf_scores.get, reverse=True)
    # Deduplicate preserving order
    seen, tags = set(), []
    for tok in ranked:
        if tok not in seen:
            seen.add(tok)
            tags.append(tok)
        if len(tags) >= top_n:
            break
    return tags


def _strip_accents(text: str) -> str:
    """Drop combining accents so 'immédiatement' matches 'immediatement'."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


# Pre-normalise the signal sets once (lowercase + accent-stripped) so we can
# match phrases by substring regardless of accents/punctuation in the input.
_URGENCY_HIGH_NORM = {_strip_accents(w.lower()) for w in _URGENCY_HIGH}
_URGENCY_MEDIUM_NORM = {_strip_accents(w.lower()) for w in _URGENCY_MEDIUM}


def _detect_urgency(text: str) -> str:
    """
    Detect urgency signals.  Works on punctuation ("urgent!"), accents
    ("immédiatement") and multi-word phrases ("cette semaine") by normalising
    the text and doing whole-word / phrase substring matching.
    """
    # Normalise: lowercase, strip accents, collapse punctuation to spaces.
    norm = _strip_accents(text.lower())
    norm = re.sub(r"[^\w\s؀-ۿ]", " ", norm)
    norm = re.sub(r"\s+", " ", norm).strip()
    norm = f" {norm} "  # pad so single-word signals match as whole words

    def _hit(signals: set) -> bool:
        for sig in signals:
            # single word → whole-word match; phrase → substring match
            needle = f" {sig} " if " " not in sig else sig
            if needle in norm:
                return True
        return False

    if _hit(_URGENCY_HIGH_NORM):
        return "HIGH"
    if _hit(_URGENCY_MEDIUM_NORM):
        return "MEDIUM"
    return "LOW"


def _category_embeddings(categories: List[str]) -> np.ndarray:
    """
    Encode (and cache) the category labels wrapped in the hypothesis template.
    Cached per ordered category set so repeated requests skip re-encoding.
    """
    key = tuple(categories)
    cached = _CATEGORY_CACHE.get(key)
    if cached is not None:
        return cached

    svc = EmbeddingService.get_instance()
    prompts = [_CATEGORY_TEMPLATE.format(c) for c in categories]
    vecs = np.array(
        svc.model.encode(prompts, normalize_embeddings=True),
        dtype=np.float32,
    )  # shape: (n_categories, dim)
    _CATEGORY_CACHE[key] = vecs
    return vecs


def _softmax_confidence(similarities: np.ndarray, best_idx: int) -> float:
    """Soft-max probability of the winning category — a relative confidence."""
    logits = similarities / _SOFTMAX_TEMPERATURE
    logits -= logits.max()                       # numerical stability
    probs = np.exp(logits)
    probs /= probs.sum()
    return float(probs[best_idx])


def classify_listing(
    title: str,
    description: str,
    available_categories: List[str],
) -> dict:
    """
    Returns:
        predicted_category (str): best-matching category name
        confidence (float): soft-max probability of the winner [0, 1]
        suggested_tags (List[str]): up to 6 extracted keywords
        urgency (str): LOW | MEDIUM | HIGH
    """
    full_text = f"{title} {description}"

    if not available_categories:
        return {
            "predicted_category": "",
            "confidence": 0.0,
            "suggested_tags": _extract_tags(title, description),
            "urgency": _detect_urgency(full_text),
        }

    svc = EmbeddingService.get_instance()

    # Encode listing text.  Title carries most signal but tripling it hurt
    # accuracy on the benchmark, so we keep it once.
    listing_vec = np.array(
        svc.model.encode(f"{title}. {description}", normalize_embeddings=True),
        dtype=np.float32,
    )

    # Cosine similarities against the cached, template-wrapped category vectors.
    category_vecs = _category_embeddings(available_categories)
    similarities = category_vecs @ listing_vec   # shape: (n_categories,)

    best_idx = int(np.argmax(similarities))
    predicted_category = available_categories[best_idx]
    confidence = round(_softmax_confidence(similarities, best_idx), 4)

    tags = _extract_tags(title, description)
    urgency = _detect_urgency(full_text)

    logger.info(
        "Classification: '%s' → '%s' (conf=%.3f, tags=%s, urgency=%s)",
        title[:40], predicted_category, confidence, tags, urgency,
    )
    return {
        "predicted_category": predicted_category,
        "confidence": confidence,
        "suggested_tags": tags,
        "urgency": urgency,
    }
