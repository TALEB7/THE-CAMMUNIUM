from pydantic import BaseModel
from typing import List, Optional


class EmbedListingRequest(BaseModel):
    listing_id: str
    title: str
    description: str
    tags: List[str] = []
    category: Optional[str] = None


class EmbedMentorRequest(BaseModel):
    mentor_profile_id: str
    headline: Optional[str] = ""
    bio: Optional[str] = ""
    expertise: List[str] = []
    industries: List[str] = []


class EmbeddingResponse(BaseModel):
    id: str
    embedding: List[float]
    model: str
    dimensions: int


class CandidateEmbedding(BaseModel):
    listing_id: str
    embedding: List[float]


class SimilarListingsRequest(BaseModel):
    listing_id: str
    query_embedding: List[float]
    candidate_embeddings: List[CandidateEmbedding]
    top_k: int = 5


class SimilarItem(BaseModel):
    id: str
    score: float


class SimilarListingsResponse(BaseModel):
    listing_id: str
    similar: List[SimilarItem]


# ── Mentor Matching ──────────────────────────────────────────────────

class MentorCandidate(BaseModel):
    mentor_profile_id: str
    embedding: List[float]
    rating: float = 0.0          # 0–5
    years_exp: int = 0
    total_sessions: int = 0
    is_available: bool = True


class MentorMatchRequest(BaseModel):
    """
    Query is the mentee's synthesized embedding (from their interests/goals text).
    Candidates are all available mentor embeddings with their quality signals.
    """
    query_embedding: List[float]
    candidates: List[MentorCandidate]
    top_k: int = 10
    # Scoring weights (must sum to 1.0)
    w_semantic: float = 0.55
    w_rating: float = 0.25
    w_experience: float = 0.12
    w_sessions: float = 0.08


class MentorMatchItem(BaseModel):
    mentor_profile_id: str
    score: float            # final composite score [0, 1]
    semantic_score: float   # raw cosine similarity
    rating_score: float
    experience_score: float
    sessions_score: float


class MentorMatchResponse(BaseModel):
    matches: List[MentorMatchItem]


# ── Price Suggestion ─────────────────────────────────────────────────

class PriceSuggestionRequest(BaseModel):
    title: str = ""
    description: str = ""
    category: str
    condition: str                        # NEW | LIKE_NEW | GOOD | FAIR | POOR (also accepts used_good, etc.)
    city: Optional[str] = None
    comparable_prices: List[float] = []   # recent sold prices for same category
    original_price: Optional[float] = None  # retail/new price — used for cold-start depreciation
    age_months: Optional[int] = None        # item age in months — drives depreciation


class PriceSuggestionResponse(BaseModel):
    min_price: float
    max_price: float
    recommended_price: float
    confidence: float                     # [0, 1]
    method: str                           # "statistical" | "ml"


# ── NLP Classification ───────────────────────────────────────────────

class ClassifyListingRequest(BaseModel):
    title: str
    description: str
    available_categories: List[str]


class ClassifyListingResponse(BaseModel):
    predicted_category: str
    confidence: float
    suggested_tags: List[str]
    urgency: Optional[str] = None         # LOW | MEDIUM | HIGH (for service requests)


# ── Sentiment Analysis ───────────────────────────────────────────────

class SentimentRequest(BaseModel):
    texts: List[str]                      # batch of review texts
    language: str = "auto"               # "fr" | "ar" | "en" | "auto"


class SentimentResult(BaseModel):
    text: str
    label: str    # POSITIVE | NEGATIVE | NEUTRAL
    score: float  # confidence [0, 1]
    compound: float  # [-1, 1]


class SentimentResponse(BaseModel):
    results: List[SentimentResult]
    avg_compound: float




# ── Churn Prediction ─────────────────────────────────────────────────

class ChurnUserInput(BaseModel):
    user_id: str
    days_since_last: float          # days since last platform activity
    action_count_30d: int           # total actions in last 30 days
    listing_count: int = 0
    session_count: int = 0          # mentorship sessions
    tks_spent: float = 0.0
    account_age_days: int = 0
    membership_active: bool = False
    monthly_tks_spent: float = 0.0  # avg monthly Tks spend (for CLV)
    membership_revenue: float = 0.0 # monthly membership value in currency (for CLV)


class ChurnPredictionRequest(BaseModel):
    users: List[ChurnUserInput]


class ChurnUserResult(BaseModel):
    user_id: str
    churn_score: float              # [0, 1] — higher = more likely to churn
    risk_level: str                 # LOW | MEDIUM | HIGH
    rfm_recency: int                # 1–5
    rfm_frequency: int              # 1–5
    rfm_monetary: int               # 1–5
    recommended_actions: List[str]  # targeted re-engagement suggestions
    clv_estimate: float = 0.0       # discounted lifetime value in currency
    clv_tier: str = "LOW"           # LOW | MEDIUM | HIGH


class ChurnPredictionResponse(BaseModel):
    predictions: List[ChurnUserResult]
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int


# ── ETA Prediction ───────────────────────────────────────────────────

class EtaRequest(BaseModel):
    category_name: Optional[str] = None          # listing category label
    seller_city: Optional[str] = None            # seller's city
    buyer_city: Optional[str] = None             # buyer's city (optional)
    condition: Optional[str] = "good"            # new | like_new | good | fair | poor
    seller_listing_count: int = 0                # provider history (total listings)
    hour_of_day: Optional[int] = None            # 0–23, defaults to current UTC hour
    day_of_week: Optional[int] = None            # 0=Mon … 6=Sun, defaults to today


class EtaBreakdown(BaseModel):
    base_hours: float
    category: str
    location_zone: str
    condition_factor: str
    seller_experience: str
    timing: str


class EtaResponse(BaseModel):
    eta_minutes: int           # canonical output — matches DTO field
    eta_hours: float
    eta_days: int
    confidence: float
    breakdown: EtaBreakdown





# ── Personalized Recommendations (MMR) ──────────────────────────────

class RecommendationCandidate(BaseModel):
    listing_id: str
    embedding: List[float]


class RecommendationRequest(BaseModel):
    user_embedding: List[float]
    candidates: List[RecommendationCandidate]
    top_k: int = 20
    diversity_lambda: float = 0.4


class RecommendationItem(BaseModel):
    listing_id: str
    relevance_score: float
    diversity_score: float
    final_score: float


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]


