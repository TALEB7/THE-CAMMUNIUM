"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import FileUploadZone from "./FileUploadZone";
import CnieAutoExtract from "./CnieAutoExtract";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useKyc from "@/hooks/useKyc";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string().min(4),
  nationality: z.string().min(2),
});

type FormValues = z.infer<typeof schema>;

export default function PersonalKycForm() {
  const { submitPersonalKyc } = useKyc();
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [cinFront, setCinFront] = useState<File | null>(null);
  const [cinBack, setCinBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append("firstName", data.firstName);
    fd.append("lastName", data.lastName);
    fd.append("dob", data.dob);
    fd.append("nationality", data.nationality);
    if (cinFront) fd.append("cinFront", cinFront, (cinFront as File).name);
    if (cinBack) fd.append("cinBack", cinBack, (cinBack as File).name);
    if (selfie) fd.append("selfie", selfie, (selfie as File).name);

    const ok = await submitPersonalKyc(fd);
    setSubmitting(false);
    if (ok) {
      router.push("/profile");
    } else {
      setError("Une erreur est survenue lors de l'envoi de votre dossier. Veuillez réessayer.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input placeholder="Prénom" {...register("firstName")} className="input" />
        <input placeholder="Nom" {...register("lastName")} className="input" />
      </div>
      <input placeholder="Date de naissance" {...register("dob")} className="input" />
      <input placeholder="Nationalité" {...register("nationality")} className="input" />

      <FileUploadZone label="Recto CIN" onChange={setCinFront} accept="image/*,application/pdf" />
      <CnieAutoExtract file={cinFront} onResult={(p) => {
        if (p.given_name) setValue('firstName', p.given_name);
        if (p.surname) setValue('lastName', p.surname);
        if (p.birth_date) setValue('dob', p.birth_date);
        if (p.nationality) setValue('nationality', p.nationality);
      }} />
      <FileUploadZone label="Verso CIN" onChange={setCinBack} accept="image/*,application/pdf" />
      <FileUploadZone label="Selfie avec la CIN" onChange={setSelfie} accept="image/*" />

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Envoi en cours..." : "Soumettre"}
      </button>
    </form>
  );
}
