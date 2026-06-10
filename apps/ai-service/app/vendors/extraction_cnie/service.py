from __future__ import annotations

import re
import logging
from typing import Optional, Any, Dict, List
import numpy as np

from .utils.easyocr_utils import OCRExtractor
from .cnie_extractor import CNIEExtractor

logger = logging.getLogger(__name__)

# Moroccan CIN format: 1-2 uppercase letters followed by 5-6 digits (e.g. AB123456, J123456)
_CIN_NUMBER_RE = re.compile(r'\b([A-Z]{1,2}\d{5,6})\b')
# Date formats found on CNIE: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD MM YYYY
_DATE_RE = re.compile(r'\b(\d{2})[.\/\- ](\d{2})[.\/\- ](\d{4})\b')


def _iter_lines(text: str) -> List[str]:
    return [line.strip() for line in (text or "").split("\n") if line.strip()]


def _normalize_date(match: re.Match) -> str:
    return f"{match.group(1)}/{match.group(2)}/{match.group(3)}"


def extract_cnie_profile_from_text(ocr_text: str) -> Dict[str, Optional[str]]:
    lines = _iter_lines(ocr_text)
    full_text = " ".join(lines)

    # Card number: match CIN pattern directly from full OCR text
    cin_match = _CIN_NUMBER_RE.search(full_text)
    card_number = cin_match.group(1) if cin_match else None

    def _extract_label_field(labels: List[str]) -> Optional[str]:
        """Extract value after a label keyword, supports both 'LABEL: value' and 'LABEL value' patterns."""
        for line in lines:
            line_upper = line.upper()
            for label in labels:
                if label.upper() in line_upper:
                    # Try colon separator first
                    parts = line.split(":", 1)
                    if len(parts) > 1 and parts[1].strip():
                        return parts[1].strip()
                    # Fallback: text after the label keyword
                    idx = line_upper.find(label.upper())
                    remainder = line[idx + len(label):].strip(" :-")
                    if remainder:
                        return remainder
        return None

    surname = _extract_label_field(["NOM", "SURNAME", "اسم العائلة", "النسب"])
    given_name = _extract_label_field(["PRENOM", "GIVEN NAME", "الاسم الشخصي", "الاسم"])
    full_name = f"{surname} {given_name}".strip() if surname and given_name else (surname or given_name)

    # Birth date: try label first, then scan all lines for date pattern
    birth_date_raw = _extract_label_field(["DATE DE NAISSANCE", "NE LE", "NEE LE", "تاريخ الازدياد"])
    if not birth_date_raw:
        date_match = _DATE_RE.search(full_text)
        if date_match:
            birth_date_raw = _normalize_date(date_match)
    elif birth_date_raw:
        date_match = _DATE_RE.search(birth_date_raw)
        if date_match:
            birth_date_raw = _normalize_date(date_match)

    birth_place = _extract_label_field(["LIEU DE NAISSANCE", "NE A", "NEE A", "مكان الازدياد"])
    address = _extract_label_field(["ADRESSE", "ADDRESS", "العنوان"])
    nationality = _extract_label_field(["NATIONALITE", "NATIONALITY", "الجنسية"]) or "Marocaine"

    logger.info(
        "CNIE text extraction: card=%s surname=%s given=%s birth_date=%s",
        card_number, surname, given_name, birth_date_raw,
    )

    return {
        "card_number": card_number,
        "surname": surname,
        "given_name": given_name,
        "full_name": full_name,
        "birth_date": birth_date_raw,
        "birth_place": birth_place,
        "address": address,
        "nationality": nationality,
    }


class CNIEService:
    def __init__(self, ocr_languages: Optional[List[str]] = None, load_ocr_model: bool = True):
        self.ocr_languages = ocr_languages or ["fr", "en"]
        self._ocr_model: Optional[OCRExtractor] = None
        if load_ocr_model:
            self._ensure_ocr_model()

    def _ensure_ocr_model(self) -> OCRExtractor:
        if self._ocr_model is None:
            self._ocr_model = OCRExtractor(lang=self.ocr_languages)
            self._ocr_model.load_model()
        return self._ocr_model

    def extract_text(self, image: np.ndarray) -> str:
        ocr_model = self._ensure_ocr_model()
        return ocr_model.extract_text(image)

    def analyze_image(self, image: np.ndarray, visualize: bool = False, ocr_text: Optional[str] = None, min_score: float = 0.0) -> Dict[str, Any]:
        extractor = CNIEExtractor()
        card_image, extraction_info = extractor.extract(image, visualize=visualize)
        detected = card_image is not None and extraction_info.get("success", False)
        confidence = float(extraction_info.get("score", 0.0) or 0.0)
        verified = bool(detected and confidence >= min_score)
        extracted_text = ocr_text or ""
        if not extracted_text:
            if detected:
                extracted_text = self.extract_text(card_image)
            else:
                extracted_text = self.extract_text(image)
        profile = extract_cnie_profile_from_text(extracted_text) if extracted_text else {k: None for k in ["card_number","surname","given_name","full_name","birth_date","birth_place","address","nationality"]}
        return {
            "document_type": "CNIE",
            "verified": verified,
            "card_detected": detected,
            "confidence": confidence,
            "card_image": card_image,
            "ocr_text": extracted_text,
            "profile": profile,
            "extraction": extraction_info,
            "error": None if detected else extraction_info.get("error", "CNIE not detected"),
        }
