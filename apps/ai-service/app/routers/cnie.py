import logging
import base64

import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

from app.services.cnie_service_wrapper import CNIEWrapperService
from app.schemas.cnie import CNIEProfileResponse

router = APIRouter(prefix="/cnie", tags=["cnie"])
logger = logging.getLogger(__name__)


@router.post("/extract", response_model=CNIEProfileResponse)
async def extract_cnie(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        arr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        service = CNIEWrapperService.get_instance()
        result = service.analyze(img, visualize=False)

        profile = result.get("profile", {})
        ocr_text = result.get("ocr_text")
        confidence = float(result.get("confidence") or 0.0)

        response = {
            **profile,
            "ocr_text": ocr_text,
            "confidence": confidence,
        }
        return response

    except Exception as e:
        logger.exception("CNIE extraction failed")
        raise HTTPException(status_code=500, detail=str(e))


class CNIEExtractBase64Request(BaseModel):
    image_base64: str


@router.post("/extract-base64", response_model=CNIEProfileResponse)
async def extract_cnie_base64(payload: CNIEExtractBase64Request):
    try:
        raw = base64.b64decode(payload.image_base64)
        arr = np.frombuffer(raw, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        service = CNIEWrapperService.get_instance()
        result = service.analyze(img, visualize=False)
        profile = result.get("profile", {})

        return {
            **profile,
            "ocr_text": result.get("ocr_text"),
            "confidence": float(result.get("confidence") or 0.0),
        }
    except Exception as e:
        logger.exception("CNIE base64 extraction failed")
        raise HTTPException(status_code=500, detail=str(e))
