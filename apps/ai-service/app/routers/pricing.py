import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import PriceSuggestionRequest, PriceSuggestionResponse
from app.services.price_suggestion_service import suggest_price

router = APIRouter(prefix="/pricing", tags=["pricing"])
logger = logging.getLogger(__name__)


@router.post("/suggest", response_model=PriceSuggestionResponse)
async def suggest_listing_price(req: PriceSuggestionRequest):
    """
    Suggest a fair price range for a marketplace listing.

    Provide `comparable_prices` (recent sold/active prices for the same
    category) for a data-driven estimate.  With fewer than 3 data points
    the service falls back to a condition-adjusted heuristic and returns a
    low confidence score so the caller can inform the user accordingly.
    """
    try:
        result = suggest_price(
            condition=req.condition,
            comparable_prices=req.comparable_prices,
            original_price=req.original_price,
            age_months=req.age_months,
        )
        return PriceSuggestionResponse(**result)
    except Exception as e:
        logger.error("Price suggestion failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
