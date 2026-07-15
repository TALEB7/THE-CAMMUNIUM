import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Adjust path to import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.churn_service import score_users
from app.services.recommendation_service import recommend_for_user
from app.vendors.extraction_cnie.service import extract_cnie_profile_from_text, _extraction_confidence
from app.services.mentor_matching_service import rank_mentors
from app.services.eta_service import predict_eta
from app.services.classification_service import _tokenize, _extract_tags
from app.services.similarity_service import cosine_similarity
from app.services.price_suggestion_service import suggest_price
from app.models.schemas import MentorCandidate


class TestAIServiceBusinessLogic(unittest.TestCase):


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

    def test_recommendation_diversity_score_inversion(self):
        """Bug 2 regression: diversity_score must be inverted (1.0 = unique, 0.0 = clone)."""
        user_embedding = [0.1, 0.2, 0.3, 0.4]
        candidates = [
            {"listing_id": "listing_1", "embedding": [0.1, 0.2, 0.3, 0.4]},
            {"listing_id": "listing_2", "embedding": [0.1, 0.2, 0.3, 0.4]},  # clone
            {"listing_id": "listing_3", "embedding": [-0.3, 0.5, -0.1, 0.2]},  # diverse
        ]
        results = recommend_for_user(user_embedding, candidates, top_k=3, diversity_lambda=0.4)

        # First item has no prior selection -> diversity_score = 1.0 (perfectly unique)
        self.assertAlmostEqual(results[0]["diversity_score"], 1.0, places=2)

        # Find the clone in results - its diversity_score should be close to 0 (redundant)
        clone_result = next(r for r in results if r["listing_id"] == "listing_2")
        self.assertLess(clone_result["diversity_score"], 0.15,
                        "Clone should have diversity_score near 0 (redundant)")

    # -- Bug 1: Mentor matching - unavailable mentors must be excluded ----------

    def test_mentor_matching_excludes_unavailable(self):
        """Bug 1 regression: mentors with is_available=false must NOT appear in results."""
        query_emb = [0.1, 0.2, 0.3, 0.4]
        candidates = [
            MentorCandidate(
                mentor_profile_id="available_1",
                embedding=[0.1, 0.2, 0.3, 0.4],
                rating=4.5, years_exp=5, total_sessions=30, is_available=True,
            ),
            MentorCandidate(
                mentor_profile_id="unavailable_star",
                embedding=[0.1, 0.2, 0.3, 0.4],  # perfect match
                rating=5.0, years_exp=15, total_sessions=100, is_available=False,
            ),
            MentorCandidate(
                mentor_profile_id="available_2",
                embedding=[0.05, 0.15, 0.25, 0.35],
                rating=3.0, years_exp=2, total_sessions=5, is_available=True,
            ),
        ]
        results = rank_mentors(query_emb, candidates, top_k=10)

        result_ids = [r.mentor_profile_id for r in results]
        self.assertNotIn("unavailable_star", result_ids,
                         "Unavailable mentor must be completely excluded from results")
        self.assertIn("available_1", result_ids)
        self.assertIn("available_2", result_ids)

    def test_mentor_matching_all_unavailable_returns_empty(self):
        """Bug 1: if all candidates are unavailable, return empty list."""
        query_emb = [0.1, 0.2, 0.3]
        candidates = [
            MentorCandidate(
                mentor_profile_id="m1", embedding=[0.1, 0.2, 0.3],
                is_available=False,
            ),
        ]
        results = rank_mentors(query_emb, candidates, top_k=5)
        self.assertEqual(results, [])

    # -- Bug 3: ETA - Rabat -> Tanger must NOT be "same_major_city" ------------

    def test_eta_different_tier1_cities_not_same_city(self):
        """Bug 3 regression: Rabat seller + Tanger buyer must be inter-city, not same_city."""
        result = predict_eta(
            category_name="telephones",
            seller_city="Rabat",
            buyer_city="Tanger",
            condition="new",
            seller_listing_count=10,
            hour_of_day=14,
            day_of_week=2,  # Wednesday
        )
        self.assertNotEqual(result["breakdown"]["location_zone"], "same_major_city",
                            "Rabat->Tanger should NOT be 'same_major_city'")
        self.assertNotEqual(result["breakdown"]["location_zone"], "same_city",
                            "Rabat->Tanger should NOT be 'same_city'")
        self.assertIn("tier1_to_tier1", result["breakdown"]["location_zone"],
                      "Rabat->Tanger should be 'tier1_to_tier1' (inter-city)")

    def test_eta_same_city_returns_same_city(self):
        """Bug 3: same city (Rabat->Rabat) should return 'same_city'."""
        result = predict_eta(
            category_name="telephones",
            seller_city="Rabat",
            buyer_city="Rabat",
            condition="new",
            seller_listing_count=10,
            hour_of_day=14,
            day_of_week=2,
        )
        self.assertEqual(result["breakdown"]["location_zone"], "same_city")

    # -- Bug 4: Classification - verb conjugations must not be extracted as tags -

    def test_tokenize_filters_conjugated_verbs(self):
        """Bug 4 regression: conjugated verbs like 'recherchons' must be filtered."""
        tokens = _tokenize("Nous recherchons une voiture occasion diesel")
        self.assertNotIn("recherchons", tokens,
                         "'recherchons' is a conjugated verb and should be filtered")
        self.assertIn("voiture", tokens)
        self.assertIn("occasion", tokens)
        self.assertIn("diesel", tokens)

    def test_tokenize_filters_various_verb_forms(self):
        """Bug 4: various conjugated verb forms should be excluded."""
        tokens = _tokenize("Nous proposons et vendons des articles cherchez ici")
        self.assertNotIn("proposons", tokens)
        self.assertNotIn("vendons", tokens)
        # "cherchez" is in the explicit stopword list
        self.assertNotIn("cherchez", tokens)

    def test_extract_tags_no_verbs(self):
        """Bug 4: extracted tags should only be nouns/adjectives, not verbs."""
        tags = _extract_tags(
            title="Recherchons developpeur Python",
            description="Nous recherchons un developpeur Python experimente pour notre startup",
        )
        self.assertNotIn("recherchons", tags)
        # Python and developpeur should be kept as meaningful nouns
        has_meaningful = any(t in tags for t in ["python", "developpeur", "startup"])
        self.assertTrue(has_meaningful, f"Expected meaningful nouns in tags, got: {tags}")

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

    # -- PFE Bug 1: cosine similarity must be bounded to [-1, 1] ---------------

    def test_cosine_similarity_bounded_for_unnormalized_vectors(self):
        """PFE Bug 1: raw (non unit-norm) vectors must still yield cosine <= 1."""
        a = [0.12, 0.45, -0.99, 0.34]   # norm ~1.15 → raw dot would exceed 1
        b = [0.11, 0.42, -0.90, 0.31]
        score = cosine_similarity(a, b)
        self.assertLessEqual(score, 1.0)
        self.assertGreaterEqual(score, -1.0)

    def test_cosine_similarity_zero_vector_guard(self):
        """PFE Bug 1: a zero-norm vector must not raise / produce NaN."""
        self.assertEqual(cosine_similarity([0.0, 0.0, 0.0], [1.0, 2.0, 3.0]), 0.0)

    def test_mentor_semantic_score_bounded(self):
        """PFE Bug 1: mentor semantic_score must be <= 1 with unnormalized embeddings."""
        candidates = [
            MentorCandidate(
                mentor_profile_id="m1",
                embedding=[0.11, 0.42, -0.90, 0.31],
                rating=4.8, years_exp=12, total_sessions=90, is_available=True,
            ),
        ]
        results = rank_mentors([0.12, 0.45, -0.99, 0.34], candidates, top_k=1)
        self.assertLessEqual(results[0].semantic_score, 1.0)

    # -- PFE Bug 2: cold-start pricing must not collapse to 1 DH ---------------

    def test_pricing_cold_start_uses_depreciation(self):
        """PFE Bug 2: with original_price + age, return a realistic band (not 1)."""
        result = suggest_price(
            condition="used_good",
            comparable_prices=[],
            original_price=15000,
            age_months=24,
        )
        self.assertEqual(result["method"], "heuristic_depreciation")
        self.assertGreater(result["recommended_price"], 1000)
        self.assertLess(result["min_price"], result["recommended_price"])
        self.assertLess(result["recommended_price"], result["max_price"])

    def test_pricing_truly_cold_still_safe(self):
        """PFE Bug 2: no signals at all → falls back gracefully (no crash)."""
        result = suggest_price(condition="GOOD", comparable_prices=[])
        self.assertEqual(result["method"], "heuristic_cold")

    # -- PFE Bug 3 & 4: CNIE confidence + address mapping ----------------------

    def test_cnie_address_not_captured_as_birthplace(self):
        """PFE Bug 4: a residence line must map to address, not birth_place."""
        ocr_text = (
            "ROYAUME DU MAROC\n"
            "12/04/1993\n"
            "FES\n"
            "JNANE L OUARD FES\n"
            "AB123456\n"
        )
        profile = extract_cnie_profile_from_text(ocr_text)
        self.assertEqual(profile["address"], "JNANE L OUARD FES")
        self.assertNotEqual(profile["birth_place"], "JNANE L OUARD FES")

    def test_cnie_confidence_reflects_completeness(self):
        """PFE Bug 3: a complete extraction must score well above the >=15 gate."""
        profile = {
            "card_number": "AB123456", "surname": "KARIMI", "given_name": "SALMA",
            "birth_date": "12/04/1993", "birth_place": "FES",
            "address": "JNANE L OUARD FES", "nationality": "Marocaine",
        }
        self.assertGreaterEqual(_extraction_confidence(profile), 15.0)
        self.assertEqual(_extraction_confidence({k: None for k in profile}), 0.0)

    def test_cnie_text_extraction_with_separators(self):
        """Test parser logic for Moroccan CNIE CIN number with various separators."""
        cases = [
            ("CIN: AB 123456\n", "AB123456"),
            ("CIN: ab-123456\n", "AB123456"),
            ("CIN: C_0939432\n", "C0939432"),
            ("CIN: c.0939432\n", "C0939432"),
            ("CIN: AB  123456\n", "AB123456"),
        ]
        for text, expected in cases:
            profile = extract_cnie_profile_from_text(text)
            self.assertEqual(profile["card_number"], expected, f"Failed for text: {text.strip()}")


if __name__ == "__main__":
    unittest.main()
