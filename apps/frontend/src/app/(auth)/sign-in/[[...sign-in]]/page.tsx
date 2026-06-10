"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

const inp = [
  "w-full h-11 rounded-xl text-sm transition focus:outline-none",
  "bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400",
  "focus:border-[#C8102E]/60 focus:ring-1 focus:ring-[#C8102E]/20",
  "dark:bg-white/[0.05] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/20",
  "dark:focus:border-[#C8102E]/60 dark:focus:bg-white/[0.07]",
].join(" ");

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });
      if (res?.error) {
        setError("Email ou mot de passe incorrect");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Heading */}
      <div>
        <h1 className="text-[1.9rem] font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
          Bon retour 👋
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-white/40">
          Connectez-vous pour accéder à votre espace The Communium
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#13141a] p-7 shadow-md dark:shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8102E]/50 to-transparent" />

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl">
              ⚠ {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
              Adresse Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/25" />
              <input
                name="email" type="email" required autoComplete="email"
                defaultValue="demo@thecommunium.com" placeholder="vous@exemple.com"
                className={`${inp} pl-10 pr-4`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
                Mot de Passe
              </label>
              <Link href="#" className="text-[11px] text-[#C8102E] hover:text-[#A60D25] transition">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/25" />
              <input
                name="password" type={showPassword ? "text" : "password"} required
                autoComplete="current-password" defaultValue="password123" placeholder="••••••••"
                className={`${inp} pl-10 pr-10`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/50 transition">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full h-11 mt-1 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all
              bg-gradient-to-r from-[#C8102E] to-[#E8233E] text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#C8102E]/20">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Se connecter <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-white/[0.06]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
            <span className="bg-white dark:bg-[#13141a] px-3 text-gray-400 dark:text-white/25">ou</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-white/35">
          Pas encore membre ?{" "}
          <Link href="/sign-up" className="font-bold text-[#C8102E] hover:text-[#A60D25] transition">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
