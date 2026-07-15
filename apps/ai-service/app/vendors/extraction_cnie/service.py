from __future__ import annotations

import re
import logging
from typing import Optional, Any, Dict, List
import numpy as np

from .utils.easyocr_utils import OCRExtractor
from .cnie_extractor import CNIEExtractor

logger = logging.getLogger(__name__)

# Moroccan CIN format: 1-2 letters (any case) followed by 5-8 digits, optionally separated by spaces/punctuation
_CIN_NUMBER_RE = re.compile(r'\b([A-Za-z]{1,2})\s*[\-\._]?\s*(\d{5,8})\b')
# Date formats found on CNIE: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD MM YYYY
_DATE_RE = re.compile(r'\b(\d{2})[.\/\- ](\d{2})[.\/\- ](\d{4})\b')


# Residence/street keywords (FR + common Moroccan address terms). A line
# containing one of these is treated as a residence address, not a birth place.
_ADDRESS_KEYWORDS = (
    "RUE", "AV", "AVENUE", "BD", "BOULEVARD", "HAY", "HAI", "QUARTIER", "QUART",
    "LOT", "LOTISSEMENT", "RES", "RESIDENCE", "IMM", "APPT", "APT", "BLOC",
    "DOUAR", "JNANE", "JNAN", "DERB", "DRB", "SECTEUR", "GROUPE",
)


def _is_address_line(line: str) -> bool:
    """True if the line looks like a residence/street address."""
    tokens = re.split(r'[\s,.\-]+', line.upper())
    return any(tok in _ADDRESS_KEYWORDS for tok in tokens)


# Core identity fields used to score extraction completeness. `nationality` is
# excluded because it defaults to "Marocaine" and would inflate the score.
_CORE_PROFILE_FIELDS = (
    "card_number", "surname", "given_name", "birth_date", "birth_place", "address",
)


def _extraction_confidence(profile: Dict[str, Optional[str]]) -> float:
    """Confidence (0–100) = proportion of core identity fields extracted.

    A complete extraction scores 100; partial extractions scale linearly so a
    realistic read of 4–6 fields clears the downstream >= 15 validation gate.
    """
    if not profile:
        return 0.0
    filled = sum(1 for f in _CORE_PROFILE_FIELDS if (profile.get(f) or "").strip())
    return round(100.0 * filled / len(_CORE_PROFILE_FIELDS), 2)


def _iter_lines(text: str) -> List[str]:
    return [line.strip() for line in (text or "").split("\n") if line.strip()]


def _normalize_date(match: re.Match) -> str:
    return f"{match.group(1)}/{match.group(2)}/{match.group(3)}"


def extract_cnie_profile_from_text(ocr_text: str) -> Dict[str, Optional[str]]:
    lines = _iter_lines(ocr_text)
    full_text = " ".join(lines)

    # Card number: match CIN pattern directly from full OCR text
    cin_match = _CIN_NUMBER_RE.search(full_text)
    card_number = f"{cin_match.group(1)}{cin_match.group(2)}".upper() if cin_match else None

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

    # Fallback for names if not found by label (common on newer Moroccan CNIE where labels NOM/PRENOM are faint background text)
    if not surname or not given_name:
        # Find index of the first line containing a date or card number to stop scanning names
        limit_idx = len(lines)
        for idx, line in enumerate(lines):
            if _DATE_RE.search(line) or _CIN_NUMBER_RE.search(line) or any(c.isdigit() for c in line):
                limit_idx = idx
                break
        
        # Gather text lines containing Latin characters before the digit/date threshold
        name_candidates = []
        for line in lines[:limit_idx]:
            if any(h in line.upper() for h in ["ROYAUME", "MAROC", "CARTE", "NATIONALE", "DIDENTITE", "IDENTITE", "الوطنية", "للتعريف", "المملكة", "المغربية"]):
                continue
            if re.search(r'[a-zA-Z]', line):
                name_candidates.append(line)
        
        if len(name_candidates) >= 2:
            if not given_name:
                given_name = name_candidates[0]
            if not surname:
                surname = name_candidates[1]

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

    # Fallback for birth place if not found by label.
    # IMPORTANT: a residence/address line (e.g. "JNANE L OUARD FES") must NOT be
    # captured here — birth place is a short place name, not a street address.
    if not birth_place:
        # Find the line containing the birth date or "بتاريخ"
        date_line_idx = -1
        for idx, line in enumerate(lines):
            if _DATE_RE.search(line) or "بتاريخ" in line:
                date_line_idx = idx
                break

        if date_line_idx != -1:
            for line in lines[date_line_idx + 1:]:
                # Stop if we hit valid until, card number, or other date/expiry patterns
                if _CIN_NUMBER_RE.search(line) or "VALABLE" in line.upper() or "jusquau" in line.lower() or "غاية" in line:
                    break
                if len(line) < 2:
                    continue
                if any(k in line.upper() for k in ["ADRESSE", "العنوان"]):
                    break
                # Skip residence/address lines — they belong in `address`, not birth place
                if _is_address_line(line):
                    continue
                if re.search(r'[a-zA-Z]', line):
                    # Non-greedy: take only the first plausible place line
                    birth_place = line
                    break

    address = _extract_label_field(["ADRESSE", "ADDRESS", "العنوان"])

    # Fallback for address if not found by label: first line that looks like a
    # residence (contains a street/residence keyword). This recovers cases like
    # "JNANE L OUARD FES" that have no explicit ADRESSE label.
    if not address:
        for line in lines:
            if _is_address_line(line) and line != birth_place:
                address = line
                break
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
        self.ocr_languages = ocr_languages or ["ar", "en"]
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

        # Card-shape detection score (0–100): how cleanly the card was framed in
        # the photo. This drives the internal `detected` flag only — it does NOT
        # measure how well the OCR text was extracted.
        card_detection_score = float(extraction_info.get("score", 0.0) or 0.0)
        detected = card_image is not None and extraction_info.get("success", False) and card_detection_score >= 15.0

        verified = bool(detected and card_detection_score >= min_score)
        extracted_text = ocr_text or ""
        if not extracted_text:
            if detected:
                extracted_text = self.extract_text(card_image)
            else:
                # Fallback to original image if card is not detected or detection score is too low/noisy
                extracted_text = self.extract_text(image)

        profile = extract_cnie_profile_from_text(extracted_text) if extracted_text else {k: None for k in ["card_number","surname","given_name","full_name","birth_date","birth_place","address","nationality"]}

        # Extraction confidence (0–100): proportion of core identity fields that
        # were successfully parsed. A complete extraction scores ~100 and clears
        # the downstream validation threshold (>= 15), independently of how the
        # card was framed in the photo.
        confidence = _extraction_confidence(profile)

        return {
            "document_type": "CNIE",
            "verified": verified,
            "card_detected": detected,
            "card_detection_score": card_detection_score,
            "confidence": confidence,
            "card_image": card_image if detected else None,
            "ocr_text": extracted_text,
            "profile": profile,
            "extraction": extraction_info,
            "error": None if detected else extraction_info.get("error", "CNIE not detected or low confidence"),
        }
