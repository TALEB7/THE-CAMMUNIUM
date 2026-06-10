"""
EasyOCR utility adapted for ai-service.
"""
import logging
import easyocr
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class OCRExtractor:
    # Arabic included: Moroccan CNIE prints fields in both French and Arabic
    def __init__(self, lang=None):
        self.lang = lang or ['fr', 'en', 'ar']
        self.reader = None

    def load_model(self):
        if self.reader is not None:
            return
        self.reader = easyocr.Reader(self.lang, gpu=False, verbose=False)

    def extract_text(self, image):
        if self.reader is None:
            self.load_model()
        if isinstance(image, str):
            img_array = cv2.imread(image)
        elif isinstance(image, Image.Image):
            img_array = np.array(image)
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        elif isinstance(image, np.ndarray):
            img_array = image
        else:
            raise ValueError("Image must be PIL Image, numpy array, or file path")
        try:
            result = self.reader.readtext(img_array)
            texts = [text for (bbox, text, confidence) in result]
            return '\n'.join(texts)
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}", exc_info=True)
            return ""
