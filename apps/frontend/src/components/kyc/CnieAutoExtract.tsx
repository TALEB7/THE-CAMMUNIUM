"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

type Profile = {
  card_number?: string;
  surname?: string;
  given_name?: string;
  full_name?: string;
  birth_date?: string;
  birth_place?: string;
  address?: string;
  nationality?: string;
  ocr_text?: string;
};

export default function CnieAutoExtract({ file, onResult }: { file: File | null; onResult: (p: Profile) => void }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const accessToken = (session?.user as any)?.accessToken as string | undefined;
    if (!accessToken) {
      setError("Session expirée. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const { data: json } = await api.post("/documents/cin/extract", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 120000, // OCR + model inference can take up to 60s
      });
      const p: Profile = {
        card_number: json.card_number,
        surname: json.surname,
        given_name: json.given_name,
        full_name: json.full_name,
        birth_date: json.birth_date,
        birth_place: json.birth_place,
        address: json.address,
        nationality: json.nationality,
        ocr_text: json.ocr_text,
      };
      setProfile(p);
      onResult(p);
    } catch (e: any) {
      setError(e.userMessage || e.message || "Erreur lors de l'extraction, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" className="btn" onClick={run} disabled={!file || loading}>
          {loading ? "Extracting..." : "Auto-extract from CIN"}
        </button>
        {error && <div className="text-red-500">{error}</div>}
      </div>
      {profile && (
        <div className="p-2 border rounded">
          <div><strong>Numéro:</strong> {profile.card_number}</div>
          <div><strong>Nom:</strong> {profile.surname}</div>
          <div><strong>Prénom:</strong> {profile.given_name}</div>
          <div><strong>Date de naissance:</strong> {profile.birth_date}</div>
        </div>
      )}
    </div>
  );
}
