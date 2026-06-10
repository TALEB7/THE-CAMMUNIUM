"use client";

import React from "react";
import { useAuth } from "@/lib/auth-client";

export default function KycPendingScreen() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-semibold">Votre dossier est en cours de vérification</h2>
      <p className="mt-4 max-w-md text-muted-foreground">
        La vérification de votre entreprise (KYB) prend généralement 24-48h. Vous recevrez un
        accès complet à la plateforme dès que votre dossier sera approuvé par notre équipe.
      </p>
      <button
        onClick={() => signOut()}
        className="mt-6 rounded border border-primary/50 px-4 py-2 text-sm font-medium text-primary hover:bg-accent transition"
      >
        Se déconnecter
      </button>
    </div>
  );
}
