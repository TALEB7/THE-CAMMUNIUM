"use client";
import React from "react";
import PersonalKycForm from "@/components/kyc/PersonalKycForm";

export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-serif">Vérification - Compte Personnel</h1>
      <div className="mt-4">
        <PersonalKycForm />
      </div>
    </div>
  );
}
