"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useT } from '@/lib/i18n';

interface Mentor {
  id: string;
  headline: string | null;
  expertise: string[];
  industries: string[];
  yearsExp: number | null;
  hourlyRate: number | null;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  user: { id: string; firstName: string; lastName: string; imageUrl?: string };
}

export default function MentorshipPage() {
  const { user } = useUser();
  const { t } = useT();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [tab, setTab] = useState<"browse" | "sessions" | "profile">("browse");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  useEffect(() => {
    fetch(`${apiUrl}/mentorship/mentors`)
      .then((r) => r.json())
      .then((data) => setMentors(data.mentors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  const requestMentor = async (mentorId: string) => {
    if (!user?.id) return;
    try {
      await fetch(`${apiUrl}/mentorship/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorProfileId: mentorId,
          menteeId: user.id,
          message: "Je souhaite bénéficier de votre mentorat.",
        }),
      });
      alert("Demande envoyée !");
    } catch {
      alert("Erreur lors de la demande");
    }
  };

  const filteredMentors = mentors.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.user.firstName?.toLowerCase().includes(q) ||
      m.user.lastName?.toLowerCase().includes(q) ||
      m.headline?.toLowerCase().includes(q) ||
      m.expertise.some((e) => e.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.mentorshipPage.title}</h1>
        <div className="flex gap-2">
          {(["browse", "sessions", "profile"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {t === "browse" ? "Trouver un mentor" : t === "sessions" ? "Mes sessions" : "Mon profil mentor"}
            </button>
          ))}
        </div>
      </div>

      {tab === "browse" && (
        <>
          <div className="mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, expertise..."
              className="w-full max-w-md px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <p className="text-4xl mb-4">🎓</p>
              <p className="text-gray-500">Aucun mentor disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor) => (
                <div key={mentor.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {mentor.user.firstName?.[0]}{mentor.user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {mentor.user.firstName} {mentor.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{mentor.headline || "Mentor"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-yellow-500">{"\u2605".repeat(Math.round(mentor.rating))}</span>
                    <span className="text-sm text-gray-500">({mentor.totalReviews} avis)</span>
                  </div>

                  {mentor.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {mentor.expertise.slice(0, 3).map((e) => (
                        <span key={e} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">{e}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    {mentor.yearsExp && (
                      <span className="text-sm text-gray-500">{mentor.yearsExp} ans exp.</span>
                    )}
                    {mentor.hourlyRate && (
                      <span className="text-sm font-semibold text-amber-700">{mentor.hourlyRate} Tks/h</span>
                    )}
                  </div>

                  <button
                    onClick={() => requestMentor(mentor.id)}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Demander un mentorat
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "sessions" && (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-gray-500">Aucune session planifiée</p>
          <p className="text-sm text-gray-400 mt-2">Vos sessions de mentorat apparaîtront ici</p>
        </div>
      )}

      {tab === "profile" && (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <p className="text-4xl mb-4">🌟</p>
          <p className="text-gray-500 mb-4">Devenez mentor et partagez votre expertise</p>
          <button className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
            Créer mon profil mentor
          </button>
        </div>
      )}
    </div>
  );
}
