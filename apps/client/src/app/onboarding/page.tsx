"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const PLANS = [
  {
    id: "PERSONAL",
    name: "Personnel",
    price: "200 Dhs/an",
    color: "blue",
    description: "Pour les professionnels individuels.",
    perks: ["Profil complet", "Réseau de contacts", "Marketplace", "50 Tks offerts"],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "500 Dhs/an",
    color: "indigo",
    description: "Pour les entreprises établies.",
    perks: ["Page entreprise", "Analytics", "Marketplace prioritaire", "150 Tks offerts"],
  },
  {
    id: "COMPANY_CREATION",
    name: "Création d'entreprise",
    price: "3 000 Dhs",
    color: "amber",
    description: "Création complète de société au Maroc.",
    perks: ["Création juridique", "Domiciliation", "Business Premium offert", "500 Tks offerts"],
  },
];

const COLORS: Record<string, { selected: string; button: string }> = {
  blue: { selected: "border-[#c9a730] bg-[#fff8e1] ring-2 ring-[#e6c200]", button: "ygo-btn-gold" },
  indigo: { selected: "border-[#1a237e] bg-[#e8eaf6] ring-2 ring-[#1a237e]", button: "ygo-btn-blue" },
  amber: { selected: "border-[#c9a730] bg-[#fff8e1] ring-2 ring-[#ffd700]", button: "ygo-btn-gold" },
};

export default function OnboardingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const handleContinue = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const accountType = selectedPlan === "COMPANY_CREATION" ? "company_creation" : selectedPlan.toLowerCase();

      const res = await fetch(`${apiUrl}/auth/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user?.id || "demo-user",
          email: user?.primaryEmailAddress?.emailAddress || "demo@communium.ma",
          firstName: user?.firstName || "Demo",
          lastName: user?.lastName || "User",
          accountType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur serveur (${res.status})`);
      }

      router.push("/profile/edit");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f0] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#1a237e] font-heading mb-2">Bienvenue sur The Communium</h1>
          <p className="text-gray-600">
            {isLoaded && user ? `Bonjour ${user.firstName} ! ` : ""}Choisissez votre plan.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`ygo-card text-left rounded-lg p-6 border-2 transition-all ${
                selectedPlan === plan.id
                  ? COLORS[plan.color].selected
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <h3 className="text-lg font-bold text-[#1a237e] font-heading mb-1">{plan.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
              <p className="text-2xl font-bold text-[#1a237e] mb-4">{plan.price}</p>
              <ul className="space-y-2">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#c9a730] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedPlan || loading}
            className={`px-12 py-3 text-lg font-semibold rounded-lg transition-all ${
              selectedPlan && !loading
                ? COLORS[PLANS.find((p) => p.id === selectedPlan)?.color || "blue"].button
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Chargement..." : "Continuer"}
          </button>
        </div>
      </div>
    </div>
  );
}
