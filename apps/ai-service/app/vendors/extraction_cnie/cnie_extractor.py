"""
Copied CNIE extractor (trimmed) from document-classification project.
"""
import cv2
import numpy as np
from typing import Tuple, Optional, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CNIEExtractor:
    def __init__(self):
        self.min_area_ratio = 0.01
        self.max_area_ratio = 0.95
        self.ideal_aspect_ratio = 1.586
        self.aspect_tolerance = 0.8

    def extract(self, image: np.ndarray, visualize: bool = False) -> Tuple[Optional[np.ndarray], Dict]:
        if image is None or image.size == 0:
            logger.error("Image invalide")
            return None, {'success': False, 'error': 'Invalid image'}

        height, width = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        _, thresh_otsu = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        thresh_adaptive = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 10)
        blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
        edges = cv2.Canny(blurred, 30, 150)
        combined = cv2.bitwise_or(thresh_otsu, thresh_adaptive)
        combined = cv2.bitwise_or(combined, edges)
        kernel = np.ones((7, 7), np.uint8)
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=3)
        combined = cv2.morphologyEx(combined, cv2.MORPH_DILATE, kernel, iterations=2)
        kernel_large = np.ones((21, 21), np.uint8)
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel_large, iterations=3)

        contours, _ = cv2.findContours(combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None, {'success': False, 'error': 'No contours found', 'num_contours': 0}

        candidates = []
        image_area = width * height
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 1000:
                continue
            area_ratio = area / image_area
            if not (self.min_area_ratio <= area_ratio <= self.max_area_ratio):
                continue
            rect = cv2.minAreaRect(contour)
            box = cv2.boxPoints(rect)
            box = np.int0(box)
            w, h = rect[1]
            if w == 0 or h == 0:
                continue
            aspect_ratio = max(w, h) / min(w, h)
            hull = cv2.convexHull(contour)
            hull_area = cv2.contourArea(hull)
            solidity = area / hull_area if hull_area > 0 else 0
            perimeter = cv2.arcLength(contour, True)
            circularity = 4 * np.pi * area / (perimeter * perimeter) if perimeter > 0 else 0
            aspect_score = 1.0 / (1.0 + abs(aspect_ratio - self.ideal_aspect_ratio))
            solidity_score = solidity if solidity >= 0.65 else solidity * 0.5
            if 0.05 <= area_ratio <= 0.35:
                area_score = 1.0
            else:
                area_score = area_ratio if area_ratio <= 0.5 else (1.0 - area_ratio) * 0.5
            rectangularity_score = 1.0 - circularity if circularity < 0.8 else 0.2
            score = aspect_score * solidity_score * area_score * rectangularity_score * 100
            candidates.append({'contour': contour, 'box': box, 'area': area, 'area_ratio': area_ratio, 'aspect_ratio': aspect_ratio, 'solidity': solidity, 'score': score, 'rect': rect})

        if not candidates:
            return None, {'success': False, 'error': 'No valid card detected', 'num_contours': len(contours)}

        candidates.sort(key=lambda x: x['score'], reverse=True)
        best = candidates[0]
        extracted = self._extract_and_warp(image, best['box'], best['rect'])
        info = {'success': True, 'num_contours': len(contours), 'num_candidates': len(candidates), 'area_ratio': best['area_ratio'], 'aspect_ratio': best['aspect_ratio'], 'solidity': best['solidity'], 'score': best['score'], 'original_size': (width, height), 'extracted_size': (extracted.shape[1], extracted.shape[0]) if extracted is not None else None}
        if visualize:
            vis = image.copy()
            import cv2 as _cv
            _cv.drawContours(vis, [best['contour']], -1, (0, 255, 0), 3)
            info['visualization'] = vis
        return extracted, info

    def _extract_and_warp(self, image, box, rect):
        points = self._order_points(box.astype('float32'))
        width = int(max(np.linalg.norm(points[0] - points[1]), np.linalg.norm(points[2] - points[3])))
        height = int(max(np.linalg.norm(points[1] - points[2]), np.linalg.norm(points[3] - points[0])))
        if height > width:
            width, height = height, width
            points = np.roll(points, 1, axis=0)
        dst = np.array([[0,0],[width-1,0],[width-1,height-1],[0,height-1]], dtype='float32')
        M = cv2.getPerspectiveTransform(points, dst)
        warped = cv2.warpPerspective(image, M, (width, height))
        return warped

    def _order_points(self, pts):
        rect = np.zeros((4,2), dtype='float32')
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        return rect
