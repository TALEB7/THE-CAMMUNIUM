from app._compat import install_codecarbon_shim

# Must run before sentence_transformers/transformers are imported (see app/_compat.py)
install_codecarbon_shim()

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.routers import embeddings, similarity, mentors, pricing, classification, sentiment, churn, recommendations, eta, cnie
from app.services.embedding_service import EmbeddingService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Warming up embedding model...")
    EmbeddingService.get_instance()
    # Pre-load EasyOCR model so the first CNIE request doesn't time out (loading takes ~30s)
    logger.info("Warming up CNIE / OCR model...")
    from app.services.cnie_service_wrapper import CNIEWrapperService
    CNIEWrapperService.get_instance()
    logger.info("AI service ready")
    yield
    logger.info("AI service shutting down")


app = FastAPI(
    title="Communium AI Service",
    description="Embedding and similarity service for The Communium",
    version="1.0.0",
    lifespan=lifespan,
)

# ── API Route Reference ──────────────────────────────────────────────────────
# IMPORTANT: Use these exact routes in Postman / NestJS / Next.js.
# Do NOT send requests to /docs#/... — that is the Swagger UI, not the API.
#
#   POST /embeddings/listing           → Generate listing embedding
#   POST /embeddings/mentor            → Generate mentor embedding
#   POST /similarity/listings          → Find similar listings (vector search)
#   POST /mentors/match                → Hybrid mentor matching
#   POST /recommendations/listings     → MMR personalized recommendations
#   POST /classify/listing             → Zero-shot classification + tag extraction
#   POST /sentiment/analyze            → Multilingual sentiment analysis
#   POST /churn/predict                → Churn risk scoring
#   POST /eta/predict                  → Delivery ETA prediction
#   POST /cnie/extract                 → Moroccan CNIE OCR extraction
#   GET  /health                       → Health check
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(embeddings.router)
app.include_router(similarity.router)
app.include_router(mentors.router)
app.include_router(pricing.router)
app.include_router(classification.router)
app.include_router(sentiment.router)
app.include_router(churn.router)
app.include_router(recommendations.router)
app.include_router(eta.router)
app.include_router(cnie.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "communium-ai"}
