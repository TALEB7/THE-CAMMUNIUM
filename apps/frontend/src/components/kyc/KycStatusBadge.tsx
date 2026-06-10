"use client";
import React from "react";

const STATUS_LABELS: Record<string, string> = {
  none: "Non vérifié",
  pending: "En cours de vérification",
  approved: "Vérifié",
  rejected: "Vérification refusée",
};

export default function KycStatusBadge({ status, type }: { status: string; type?: string }) {
  const color =
    status === "approved" ? "bg-green-600" :
    status === "rejected" ? "bg-red-600" :
    status === "pending" ? "bg-yellow-500" :
    "bg-muted text-muted-foreground";

  const prefix = type === "business" ? "KYB · " : "";
  const label = STATUS_LABELS[status] || status || "Non vérifié";

  return (
    <span className={`inline-block px-2 py-1 rounded text-white text-xs ${color}`}>
      {prefix}{label}
    </span>
  );
}
