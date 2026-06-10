"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Briefcase, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

const inp = [
  "w-full h-11 rounded-xl text-sm transition focus:outline-none",
  "bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400",
  "focus:border-[#C8102E]/60 focus:ring-1 focus:ring-[#C8102E]/20",
  "dark:bg-white/[0.05] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/20",
  "dark:focus:border-[#C8102E]/60 dark:focus:bg-white/[0.07]",
].join(" ");

const lbl = "text-[11px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest";
const icon = "text-gray-400 dark:text-white/25";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const email     = formData.get("email")     as string;
    const password  = formData.get("password")  as string;
    const firstName = formData.get("firstName") as string;
    const lastName  = formData.get("lastName")  as string;
    const phone     = formData.get("phone")     as string;

    try {
      const regRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName, accountType, phone }),
        },
      );
      if (!regRes.ok) {
        const data = await regRes.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de la création du compte.");
      }
      const res = await signIn("credentials", { redirect: false, email, password });
      if (res?.error) throw new Error("Erreur de connexion après inscription.");
      router.push("/onboarding");
      router.refresh();
    } catch (err: any) {
      setError(err.message === "Failed to fetch"
        ? "Impossible de contacter le serveur. Vérifiez que le backend est démarré."
        : err.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-[1.9rem] font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
          Rejoindre The Communium
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-white/40">
          Créez votre compte et développez votre réseau professionnel
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#13141a] p-7 shadow-md dark:shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8102E]/50 to-transparent" />

        {/* Account type toggle */}
        <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] gap-1 mb-6">
          {[
            { value: "personal" as const, icon: User,      label: "Personnel" },
            { value: "business" as const, icon: Briefcase, label: "Business" },
          ].map(({ value, icon: Icon, label }) => (
            <button key={value} type="button" onClick={() => setAccountType(value)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                accountType === value
                  ? "bg-white dark:bg-white/10 text-[#C8102E] dark:text-white shadow-sm border border-gray-200 dark:border-white/10"
                  : "text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl">
              ⚠ {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={lbl}>Prénom</label>
              <div className="relative">
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${icon}`} />
                <input name="firstName" type="text" required autoComplete="given-name"
                  placeholder="Jean" className={`${inp} pl-10`} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Nom</label>
              <div className="relative">
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${icon}`} />
                <input name="lastName" type="text" required autoComplete="family-name"
                  placeholder="Dupont" className={`${inp} pl-10`} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={lbl}>Email</label>
            <div className="relative">
              <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${icon}`} />
              <input name="email" type="email" required autoComplete="email"
                placeholder="vous@exemple.com" className={`${inp} pl-10`} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={lbl}>Téléphone</label>
            <div className="relative">
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${icon}`}>+212</span>
              <input name="phone" type="tel" required
                placeholder="6 00 00 00 00" className={`${inp} pl-14`} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={lbl}>Mot de Passe</label>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${icon}`} />
              <input name="password" type={showPassword ? "text" : "password"} required
                autoComplete="new-password" minLength={8}
                placeholder="8+ caractères" className={`${inp} pl-10 pr-10`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${icon} hover:text-gray-600 dark:hover:text-white/50 transition`}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full h-11 mt-1 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all
              bg-gradient-to-r from-[#C8102E] to-[#E8233E] text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#C8102E]/20">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continuer <ArrowRight className="h-4 w-4" /></>}
          </button>

          <p className="text-[11px] text-center text-gray-400 dark:text-white/25">
            En continuant, vous acceptez nos{" "}
            <Link href="/terms" className="text-[#C8102E] hover:underline">Conditions d'utilisation</Link>.
          </p>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-white/[0.06]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
            <span className="bg-white dark:bg-[#13141a] px-3 text-gray-400 dark:text-white/25">ou</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-white/35">
          Déjà membre ?{" "}
          <Link href="/sign-in" className="font-bold text-[#C8102E] hover:text-[#A60D25] transition">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
