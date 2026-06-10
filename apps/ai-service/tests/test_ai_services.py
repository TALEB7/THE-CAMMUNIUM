import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Adjust path to import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.price_anomaly_service import detect_price_anomaly
from app.services.churn_service import score_users
from app.services.recommendation_service import recommend_for_user
from app.services.fraud_detection_service import detect_review_anomalies
from app.vendors.extraction_cnie.service import extract_cnie_profile_from_text


class TestAIServiceBusinessLogic(unittest.TestCase):
    def test_price_anomaly_detection_normal(self):
        """Test pricing anomaly detection with a normal price."""
        comparables = [100.0, 110.0, 105.0, 95.0, 102.0, 98.0, 101.0]
        result = detect_price_anomaly(102.0, comparables)
        self.assertFalse(result["is_anomaly"])
        self.assertEqual(result["direction"], "NORMAL")
        self.assertGreater(result["confidence"], 0.0)

    def test_price_anomaly_detection_outlier_high(self):
        """Test pricing anomaly detection with an abnormally high price."""
        comparables = [100.0, 110.0, 105.0, 95.0, 102.0, 98.0, 101.0]
        result = detect_price_anomaly(500.0, comparables)
        self.assertTrue(result["is_anomaly"])
        self.assertEqual(result["direction"], "TOO_HIGH")

    def test_price_anomaly_detection_outlier_low(self):
        """Test pricing anomaly detection with an abnormally low price."""
        comparables = [100.0, 110.0, 105.0, 95.0, 102.0, 98.0, 101.0]
        result = detect_price_anomaly(10.0, comparables)
        self.assertTrue(result["is_anomaly"])
        self.assertEqual(result["direction"], "TOO_LOW")

    def test_churn_prediction_low_risk(self):
        """Test churn prediction scoring for a highly active user (low risk)."""
        users = [
            {
                "user_id": "user_active",
                "days_since_last": 1.0,         # Active yesterday
                "action_count_30d": 50,         # High activity
                "listing_count": 5,
                "session_count": 3,
                "tks_spent": 120.0,
                "account_age_days": 180,
                "membership_active": True,
                "monthly_tks_spent": 40.0,
                "membership_revenue": 99.0
            }
        ]
        result = score_users(users)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["user_id"], "user_active")
        self.assertEqual(result[0]["risk_level"], "LOW")
        self.assertLess(result[0]["churn_score"], 0.35)

    def test_churn_prediction_high_risk(self):
        """Test churn prediction scoring for an inactive user (high risk)."""
        users = [
            {
                "user_id": "user_inactive",
                "days_since_last": 60.0,        # Inactive for 2 months
                "action_count_30d": 0,          # No activity
                "listing_count": 0,
                "session_count": 0,
                "tks_spent": 0.0,
                "account_age_days": 15,
                "membership_active": False
            }
        ]
        result = score_users(users)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["user_id"], "user_inactive")
        self.assertEqual(result[0]["risk_level"], "HIGH")
        self.assertGreaterEqual(result[0]["churn_score"], 0.65)
        self.assertIn("send_re_engagement_email", result[0]["recommended_actions"])

    def test_recommendation_diversity_mmr(self):
        """Test Maximal Marginal Relevance (MMR) recommendation diversity."""
        user_embedding = [0.1, 0.2, 0.3, 0.4]
        # Candidates where list1 is identical to list2, but MMR should prioritize diversity
        candidates = [
            {"listing_id": "listing_1", "embedding": [0.1, 0.2, 0.3, 0.4]}, # exact match to user taste
            {"listing_id": "listing_2", "embedding": [0.1, 0.2, 0.3, 0.4]}, # duplicate of listing_1
            {"listing_id": "listing_3", "embedding": [-0.1, 0.4, 0.2, -0.3]} # diverse item
        ]
        
        # Test pure relevance (lambda = 0.0) -> duplicates will be ranked first
        rel_results = recommend_for_user(user_embedding, candidates, top_k=2, diversity_lambda=0.0)
        self.assertEqual(rel_results[0]["listing_id"], "listing_1")
        self.assertEqual(rel_results[1]["listing_id"], "listing_2")
        
        # Test MMR with diversity (lambda = 0.6) -> diverse item should be chosen over duplicate
        div_results = recommend_for_user(user_embedding, candidates, top_k=2, diversity_lambda=0.6)
        self.assertEqual(div_results[0]["listing_id"], "listing_1")
        self.assertEqual(div_results[1]["listing_id"], "listing_3")

    def test_cnie_text_extraction(self):
        """Test parser logic for extracting profiles from Moroccan CNIE OCR text."""
        ocr_text = (
            "ROYAUME DU MAROC\n"
            "CARTE NATIONALE D'IDENTITE ELECTRONIQUE\n"
            "NOM: EL OMRANI\n"
            "PRENOM: YASSINE\n"
            "DATE DE NAISSANCE: 12.04.1993\n"
            "LIEU DE NAISSANCE: RABAT\n"
            "ADRESSE: 45 RUE JBAL TOUBKAL, APPT 4, AGDAL, RABAT\n"
            "NATIONALITE: MAROCAINE\n"
            "CIN: AB123456\n"
        )
        profile = extract_cnie_profile_from_text(ocr_text)
        self.assertEqual(profile["card_number"], "AB123456")
        self.assertEqual(profile["surname"], "EL OMRANI")
        self.assertEqual(profile["given_name"], "YASSINE")
        self.assertEqual(profile["full_name"], "EL OMRANI YASSINE")
        self.assertEqual(profile["birth_date"], "12/04/1993")
        self.assertEqual(profile["birth_place"], "RABAT")
        self.assertEqual(profile["nationality"], "MAROCAINE")
        self.assertIn("45 RUE JBAL TOUBKAL", profile["address"])

    @patch('app.services.fraud_detection_service.EmbeddingService')
    def test_fraud_review_anomaly_duplicates(self, mock_embedding_class):
        """Test fraud detection when duplicate reviews are submitted."""
        # Mock EmbeddingService instance and the SentenceTransformer model
        mock_instance = MagicMock()
        mock_embedding_class.get_instance.return_value = mock_instance
        # Mock encoder returning same vectors for duplicate texts
        mock_instance.model.encode.return_value = [
            [1.0, 0.0],
            [1.0, 0.0]
        ]
        
        reviews = [
            {"text": "Super produit je le recommande vivement!", "rating": 5, "reviewer_id": "user1", "created_at": "2026-06-09T10:00:00Z", "listing_id": "listing1"},
            {"text": "Super produit je le recommande vivement!", "rating": 5, "reviewer_id": "user2", "created_at": "2026-06-09T10:05:00Z", "listing_id": "listing1"}
        ]
        
        result = detect_review_anomalies(reviews, "listing1")
        self.assertTrue(result["is_suspicious"])
        self.assertTrue(any("duplicate_text" in flag for flag in result["flags"]))


if __name__ == "__main__":
    unittest.main()
