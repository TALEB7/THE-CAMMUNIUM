"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUser } from "@/lib/auth-client";
import { api } from "@/lib/api";
import {
  User, Briefcase, Calendar, Hash, Globe, MapPin,
  ChevronLeft, ArrowRight, CheckCircle2, Star,
  ShieldCheck, Zap, Loader2, Camera, Search,
  Sparkles, UploadCloud, Phone, AlertCircle, Building2,
  Mail, FileText, FileCheck2,
} from "lucide-react";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";
import { CITIES } from "@communium/shared";

// Detect a known Moroccan/international city inside a free-text string (e.g. the
// OCR-extracted address "JNANE L OUARD FES" → "Fès"). Accent/case-insensitive,
// whole-word match so a residence line resolves to its city.
const stripDiacritics = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
const detectCity = (text?: string): string => {
  if (!text) return "";
  const hay = ` ${stripDiacritics(text).toUpperCase().replace(/[^A-Z\s]/g, " ").replace(/\s+/g, " ")} `;
  for (const c of CITIES) {
    if (hay.includes(` ${stripDiacritics(c).toUpperCase()} `)) return c;
  }
  return "";
};

const INTERESTS = [
  "Finance & Investissement", "Immobilier", "Commerce & Import-Export",
  "Agriculture & Agroalimentaire", "Tech & Innovation", "Industrie & Manufacturing",
  "Services & Consulting", "RH & Recrutement", "Santé & Pharma",
  "Tourisme & Hôtellerie", "Éducation & Formation", "Startup & Entrepreneuriat",
  "Marchés Publics", "International & Export", "Artisanat & Tradition",
  "Marketing & Communication", "Juridique & Compliance", "Logistique & Transport",
  "Energie & Environnement", "E-commerce", "Intelligence Artificielle", "Data Science",
];

const PERSONAL_PLANS = [
  { id: "personal_free",    name: "Gratuit",  price: "0",   unit: "Dhs/An", perks: ["Profil complet", "Réseau de contacts", "Marketplace standard"] },
  { id: "personal_premium", name: "Premium",  price: "4",   unit: "$/Mois", isRecommended: true,
    perks: ["Badge VIP", "Réductions jusqu'à 90%", "Gagnez des TKS!", "Priorité support"] },
];

const BUSINESS_PLANS = [
  { id: "business_free",    name: "Pack Standard",    price: "0",    unit: "Dhs/An", perks: ["Page Entreprise", "Listing standard", "Visibilité locale"] },
  { id: "business_premium", name: "Pack Premium",     price: "4",    unit: "$/Mois", isRecommended: true,
    perks: ["Ligne directe business", "Partenariats investis", "Accès marchés publics", "Matchmaking"] },
];

const COMPANY_CREATION_PLANS = [
  { id: "company_creation", name: "Création Société", price: "37",   unit: "Dhs/An", isRecommended: true,
    perks: ["Accompagnement complet", "Domiciliation", "Business Premium inclus"] },
];

const STEP_LABELS_PERSONAL = ["Type", "Identité & Coordonnées", "Intérêts", "Offre", "Confirmation"];
const STEP_LABELS_BUSINESS = ["Type", "Identité & Coordonnées", "Intérêts", "Vérification", "Offre", "Confirmation"];

const BUSINESS_ROLES = [
  "CEO / Directeur Général", "CFO / Directeur Financier", "COO / Directeur des Opérations",
  "Gérant", "Investment Manager", "Responsable Développement", "Associé / Actionnaire", "Autre",
];

const KYB_DOCS: { key: "rc" | "statuts" | "representativeId" | "taxCert"; label: string; desc: string }[] = [
  { key: "rc", label: "Registre de Commerce (Modèle 7)", desc: "Extrait du registre de commerce de l'entreprise" },
  { key: "statuts", label: "Statuts de la société", desc: "Statuts juridiques (SARL, SA...)" },
  { key: "representativeId", label: "CIN du représentant légal", desc: "Pièce d'identité de la personne en charge" },
  { key: "taxCert", label: "Attestation Taxe Professionnelle / ICE", desc: "Justificatif fiscal de l'entreprise" },
];

// ─── shared style tokens ──────────────────────────────────────────────────────
const inpBase = [
  "w-full h-11 rounded-xl text-sm focus:outline-none transition px-4",
  "bg-gray-100 border text-gray-900 placeholder:text-gray-400",
  "focus:ring-1 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/20",
].join(" ");

const inp = `${inpBase} border-gray-200 focus:border-[#C8102E]/50 focus:ring-[#C8102E]/20 dark:border-white/[0.08] dark:focus:border-[#C8102E]/50 dark:focus:bg-white/[0.07]`;
const inpErr = `${inpBase} border-red-400 focus:border-red-500 focus:ring-red-400/20 dark:border-red-500/60 dark:focus:border-red-500`;

const lbl = "block text-[11px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-1.5";
const backBtn = "flex-[0.4] h-12 flex items-center justify-center gap-2 border border-gray-200 dark:border-white/[0.1] rounded-2xl text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] font-semibold text-sm transition-all";
const nextBtn = "flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#C8102E] to-[#E8233E] text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all";

// ─── helpers ──────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-red-400 mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" /> {msg}
    </p>
  );
}

function inputCls(name: string, errors: Record<string, string>) {
  return errors[name] ? inpErr : inp;
}

// ─── main component ───────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    accountType: "personal", interests: [] as string[],
    firstName: "", lastName: "",
    birthday: "", identityType: "cin", identityNumber: "",
    companyName: "", rc: "", creationDate: "",
    role: "", personInCharge: "", companyEmail: "",
    phone: "", country: "Marocaine", city: "", address: "",
    avatarUrl: "", selectedPlan: "personal_free",
  });

  const [cinFile, setCinFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] = useState(false);

  const [kybFiles, setKybFiles] = useState<{
    rc: File | null; statuts: File | null; representativeId: File | null; taxCert: File | null;
  }>({ rc: null, statuts: null, representativeId: null, taxCert: null });
  const [kybUploading, setKybUploading] = useState(false);
  const [kybError, setKybError] = useState<string | null>(null);

  const totalSteps = form.accountType === "business" ? 6 : 5;
  const STEP_LABELS = form.accountType === "business" ? STEP_LABELS_BUSINESS : STEP_LABELS_PERSONAL;
  const STEP_KYB = form.accountType === "business" ? 4 : -1;
  const STEP_OFFER = form.accountType === "business" ? 5 : 4;
  const STEP_CONFIRM = form.accountType === "business" ? 6 : 5;

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isLoaded && user && !initialized) {
      const type = (user as any).accountType || "personal";
      setForm((p) => ({
        ...p,
        accountType: type,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: (user as any).phone || "",
        selectedPlan: type === "business" ? "business_free" : "personal_free",
      }));
      setInitialized(true);
    }
  }, [isLoaded, user, initialized]);

  const field = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name;
    setForm((p) => ({ ...p, [name]: e.target.value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const toggleInterest = (tag: string) =>
    setForm((p) => ({
      ...p,
      interests: p.interests.includes(tag)
        ? p.interests.filter((i) => i !== tag)
        : [...p.interests, tag],
    }));

  // ── validation ──────────────────────────────────────────────────────────────
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};

    if (s === 2) {
      if (form.accountType === "personal") {
        if (!form.firstName.trim())      errs.firstName      = "Le prénom est requis";
        if (!form.lastName.trim())       errs.lastName       = "Le nom de famille est requis";
        if (!form.birthday)              errs.birthday       = "La date de naissance est requise";
        if (!form.identityNumber.trim()) errs.identityNumber = "Le numéro de pièce d'identité est requis";
      } else if (form.accountType === "business") {
        if (!form.companyName.trim())  errs.companyName  = "Le nom de l'entreprise est requis";
        if (!form.rc.trim())           errs.rc           = "Le numéro RC est requis";
        if (!form.creationDate)        errs.creationDate = "La date de création est requise";
      } else if (form.accountType === "company_creation") {
        if (!form.companyName.trim())  errs.companyName  = "Le nom du projet d'entreprise est requis";
      }

      if (!form.phone.trim())   errs.phone   = "Le numéro de téléphone est requis";
      if (!form.city.trim())    errs.city    = "La ville est requise";
      if (!form.country.trim()) errs.country = "La nationalité est requise";
    }

    if (s === STEP_KYB && form.accountType === "business") {
      if (!form.role.trim())           errs.role           = "La fonction est requise";
      if (!form.personInCharge.trim()) errs.personInCharge = "Le nom de la personne en charge est requis";
      if (!form.companyEmail.trim())   errs.companyEmail   = "L'email professionnel est requis";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail)) errs.companyEmail = "Email invalide";

      for (const doc of KYB_DOCS) {
        if (!kybFiles[doc.key]) errs[`kyb_${doc.key}`] = "Document requis";
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = (from: number) => {
    if (validateStep(from)) {
      setFieldErrors({});
      setStep(from + 1);
    }
  };

  // ── CIN extract ─────────────────────────────────────────────────────────────
  const handleCinExtract = async () => {
    if (!cinFile) return;
    setExtracting(true);
    setExtractError(null);
    setExtractSuccess(false);

    const accessToken = (session?.user as any)?.accessToken as string | undefined;
    if (!accessToken) {
      setExtractError("Session expirée. Veuillez vous reconnecter.");
      setExtracting(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", cinFile, cinFile.name);
      const { data: json } = await api.post("/documents/cin/extract", fd, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${accessToken}` },
        timeout: 120000,
      });

      let formattedBday = "";
      if (json.birth_date) {
        const d = json.birth_date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          formattedBday = d;
        } else {
          const parts = d.split(/[\/\.\-]/);
          if (parts.length === 3) {
            formattedBday = parts[2].length === 4
              ? `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
              : `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
          }
        }
      }

      setForm((p) => ({
        ...p,
        firstName:      json.given_name?.trim()  || p.firstName,
        lastName:       json.surname?.trim()      || p.lastName,
        birthday:       formattedBday             || p.birthday,
        identityNumber: json.card_number?.toUpperCase()?.trim() || p.identityNumber,
        // Nationalité (le champ affiche la nationalité, ex. "Marocaine")
        country:        json.nationality?.trim()  || p.country,
        // Détecte la ville depuis l'adresse extraite (ex. "JNANE L OUARD FES" → "Fès"),
        // à défaut depuis le lieu de naissance, puis en dernier recours dans le texte OCR
        // brut complet (robuste si l'adresse/lieu sont mal lus). L'adresse elle-même reste
        // à saisir par l'utilisateur.
        city:           detectCity(json.address) || detectCity(json.birth_place) || detectCity(json.ocr_text) || p.city,
      }));
      setFieldErrors({});
      setExtractSuccess(true);
    } catch (err: any) {
      setExtractError(err.userMessage || err.message || "Impossible d'analyser la CIN");
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setKybError(null);
    try {
      await api.post("/auth/onboarding", { email: (user as any).email, ...form });

      if (form.accountType === "business") {
        setKybUploading(true);
        try {
          const fd = new FormData();
          if (kybFiles.rc) fd.append("rc", kybFiles.rc);
          if (kybFiles.statuts) fd.append("statuts", kybFiles.statuts);
          if (kybFiles.representativeId) fd.append("representativeId", kybFiles.representativeId);
          if (kybFiles.taxCert) fd.append("taxCert", kybFiles.taxCert);
          fd.append("representativeName", form.personInCharge);
          await api.post("/kyc/business", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (kycErr: any) {
          setKybError(kycErr.userMessage || kycErr.message || "Échec de l'envoi des documents KYB");
        } finally {
          setKybUploading(false);
        }
      }

      await update();
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0e12] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#C8102E]" />
      </div>
    );
  }

  const filtered = INTERESTS.filter((i) => i.toLowerCase().includes(search.toLowerCase()));

  // ─── step renders ─────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── STEP 1 — Type de compte ─────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                Quel type de compte souhaitez-vous créer ?
              </h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">
                Choisissez le profil qui correspond à votre situation
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  value: "personal",
                  icon: User,
                  title: "Compte Personnel",
                  desc: "Pour les particuliers, freelances et professionnels indépendants",
                  items: ["Profil personnel complet", "Réseau & contacts directs", "Marketplace & opportunités"],
                },
                {
                  value: "business",
                  icon: Building2,
                  title: "Compte Entreprise",
                  desc: "Pour les sociétés, startups et organisations",
                  items: ["Page entreprise officielle", "Gestion d'équipe", "Accès marchés & appels d'offres"],
                },
              ].map(({ value, icon: Icon, title, desc, items }) => {
                const sel = form.accountType === value || (value === "business" && form.accountType === "company_creation");
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        accountType: value === "business" ? "business" : "personal",
                        selectedPlan: value === "business" ? "business_free" : "personal_free",
                      }))
                    }
                    className={`relative flex flex-col p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                      sel
                        ? "border-[#C8102E] bg-[#C8102E]/5 shadow-lg shadow-[#C8102E]/10 scale-[1.02]"
                        : "border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    {sel && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C8102E] flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </span>
                    )}
                    <div className={`inline-flex p-3 rounded-xl mb-4 ${sel ? "bg-[#C8102E]/10" : "bg-gray-100 dark:bg-white/[0.05]"}`}>
                      <Icon className={`h-6 w-6 ${sel ? "text-[#C8102E]" : "text-gray-400 dark:text-white/30"}`} />
                    </div>
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-1">{title}</h3>
                    <p className="text-xs text-gray-500 dark:text-white/40 mb-4">{desc}</p>
                    <ul className="space-y-1.5">
                      {items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/55">
                          <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${sel ? "text-[#C8102E]" : "text-gray-300 dark:text-white/20"}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {(form.accountType === "business" || form.accountType === "company_creation") && (
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-extrabold text-[#C8102E] dark:text-[#E8233E] uppercase tracking-wider">
                  Option de création de l'entreprise
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, accountType: "business", selectedPlan: "business_free" }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.accountType === "business"
                        ? "border-[#C8102E] bg-[#C8102E]/5 shadow-sm"
                        : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#13141a] hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                      Entreprise existante
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      J'ai déjà un numéro de Registre de Commerce (RC) et des statuts.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, accountType: "company_creation", selectedPlan: "company_creation" }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.accountType === "company_creation"
                        ? "border-[#C8102E] bg-[#C8102E]/5 shadow-sm"
                        : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#13141a] hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                      Création d'entreprise (37 Dhs/An)
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Je souhaite être accompagné pour créer légalement ma société.
                    </p>
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => setStep(2)} className={nextBtn}>
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        );

      // ── STEP 2 — Identité & Coordonnées ─────────────────────────────────────
      case 2:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <div className="inline-flex p-3.5 rounded-2xl bg-[#C8102E]/10 mb-3">
                <User className="h-6 w-6 text-[#C8102E]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                {form.accountType === "personal" ? "Votre identité & Coordonnées" : "Identité & Coordonnées de l'entreprise"}
              </h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">
                {form.accountType === "personal"
                  ? "Renseignez vos informations d'identité et de contact (extraites automatiquement depuis votre CIN)"
                  : "Renseignez les informations légales et de contact de votre entreprise"}
              </p>
            </div>

            {form.accountType === "personal" ? (
              <>
                {/* CIN scanner */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#C8102E] dark:text-[#E8233E] uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Remplissage automatique par IA (Recommandé)
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white/40">
                    Uploadez le recto de votre CIN pour pré-remplir tous les champs automatiquement.
                  </p>
                  <div className="flex gap-3 items-center">
                    <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 dark:border-white/[0.12] hover:border-[#C8102E]/50 rounded-xl cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.01] transition-all">
                      <UploadCloud className="h-6 w-6 text-gray-400 dark:text-white/30 mb-1" />
                      <p className="text-[11px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider px-2 text-center">
                        {cinFile ? cinFile.name : "Choisir recto CIN (image)"}
                      </p>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          setCinFile(e.target.files?.[0] || null);
                          setExtractSuccess(false);
                          setExtractError(null);
                        }}
                      />
                    </label>
                    {cinFile && (
                      <button type="button" disabled={extracting} onClick={handleCinExtract}
                        className="h-24 px-4 bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-purple-600/15 hover:brightness-110 disabled:opacity-40 transition-all">
                        {extracting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        <span>{extracting ? "Analyse..." : "Scanner"}</span>
                      </button>
                    )}
                  </div>
                  {extractError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{extractError}</div>
                  )}
                  {extractSuccess && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" /> Champs préremplis avec succès !
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Prénom <span className="text-[#C8102E]">*</span></label>
                    <input name="firstName" value={form.firstName} onChange={field}
                      readOnly={form.accountType === "personal"}
                      className={`${inputCls("firstName", fieldErrors)} ${form.accountType === "personal" ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-white/5" : ""}`} placeholder="Prénom" />
                    <FieldError msg={fieldErrors.firstName} />
                  </div>
                  <div>
                    <label className={lbl}>Nom <span className="text-[#C8102E]">*</span></label>
                    <input name="lastName" value={form.lastName} onChange={field}
                      readOnly={form.accountType === "personal"}
                      className={`${inputCls("lastName", fieldErrors)} ${form.accountType === "personal" ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-white/5" : ""}`} placeholder="Nom de famille" />
                    <FieldError msg={fieldErrors.lastName} />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Date de naissance <span className="text-[#C8102E]">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                    <input name="birthday" type="date" value={form.birthday} onChange={field}
                      readOnly={form.accountType === "personal"}
                      className={`${inputCls("birthday", fieldErrors)} pl-10 ${form.accountType === "personal" ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-white/5" : ""}`} />
                  </div>
                  <FieldError msg={fieldErrors.birthday} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Type de pièce</label>
                    <select name="identityType" value={form.identityType} onChange={field}
                      disabled={form.accountType === "personal"}
                      className={`${inp} cursor-pointer appearance-none ${form.accountType === "personal" ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-white/5" : ""}`}>
                      <option value="cin">CIN</option>
                      <option value="passport">Passeport</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Numéro <span className="text-[#C8102E]">*</span></label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                      <input name="identityNumber" value={form.identityNumber} onChange={field}
                        readOnly={form.accountType === "personal"}
                        className={`${inputCls("identityNumber", fieldErrors)} pl-10 uppercase ${form.accountType === "personal" ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-white/5" : ""}`}
                        placeholder="BE 123456" />
                    </div>
                    <FieldError msg={fieldErrors.identityNumber} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={lbl}>
                    {form.accountType === "company_creation" ? "Nom du projet d'entreprise" : "Nom de l'entreprise"} <span className="text-[#C8102E]">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                    <input name="companyName" value={form.companyName} onChange={field}
                      className={`${inputCls("companyName", fieldErrors)} pl-10`} 
                      placeholder={form.accountType === "company_creation" ? "Ex: My Future Startup" : "Société SARL"} />
                  </div>
                  <FieldError msg={fieldErrors.companyName} />
                </div>
                {form.accountType === "business" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Date de création <span className="text-[#C8102E]">*</span></label>
                      <input name="creationDate" type="date" value={form.creationDate} onChange={field}
                        className={inputCls("creationDate", fieldErrors)} />
                      <FieldError msg={fieldErrors.creationDate} />
                    </div>
                    <div>
                      <label className={lbl}>Numéro RC <span className="text-[#C8102E]">*</span></label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                        <input name="rc" value={form.rc} onChange={field}
                          className={`${inputCls("rc", fieldErrors)} pl-10`} placeholder="12345" />
                      </div>
                      <FieldError msg={fieldErrors.rc} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Coordonnées communes */}
            <div className="border-t border-gray-100 dark:border-white/[0.06] pt-5 space-y-4">
              <p className="text-[11px] font-extrabold text-[#C8102E] dark:text-[#E8233E] uppercase tracking-widest">
                Coordonnées de contact
              </p>

              <div>
                <label className={lbl}>Téléphone <span className="text-[#C8102E]">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                  <input name="phone" value={form.phone} onChange={field}
                    className={`${inputCls("phone", fieldErrors)} pl-10`} placeholder="+212 6 00 00 00 00" />
                </div>
                <FieldError msg={fieldErrors.phone} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Ville <span className="text-[#C8102E]">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                    <input name="city" value={form.city} onChange={field}
                      readOnly={form.accountType === "personal"}
                      className={`${inputCls("city", fieldErrors)} pl-10 ${form.accountType === "personal" ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-white/5" : ""}`} placeholder="Casablanca" />
                  </div>
                  <FieldError msg={fieldErrors.city} />
                </div>
                <div>
                  <label className={lbl}>Nationalité <span className="text-[#C8102E]">*</span></label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                    <input name="country" value={form.country} onChange={field}
                      readOnly={form.accountType === "personal"}
                      className={`${inputCls("country", fieldErrors)} pl-10 ${form.accountType === "personal" ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-white/5" : ""}`} placeholder="Marocaine" />
                  </div>
                  <FieldError msg={fieldErrors.country} />
                </div>
              </div>

              <div>
                <label className={lbl}>Adresse complète</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                  <input name="address" value={form.address} onChange={field}
                    className={`${inp} pl-10`} placeholder="Quartier, Rue, Numéro, Étage..." />
                </div>
              </div>
            </div>

            {Object.keys(fieldErrors).length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400 font-semibold">
                  Veuillez remplir tous les champs obligatoires avant de continuer.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(1)} className={backBtn}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button onClick={() => goNext(2)} className={nextBtn}>
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      // ── STEP 3 — Intérêts ───────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <div className="inline-flex p-3.5 rounded-2xl bg-[#C8102E]/10 mb-3">
                <Star className="h-6 w-6 text-[#C8102E]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                Centres d'intérêt
              </h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">
                Sélectionnez au moins{" "}
                <span className="text-gray-700 dark:text-white/70 font-semibold">3 domaines</span>{" "}
                pour personnaliser votre fil d'actualité
              </p>
            </div>

            <div className="relative max-w-sm mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/25" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un secteur..." className={`${inp} pl-10 rounded-full`} />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {filtered.map((tag) => {
                const sel = form.interests.includes(tag);
                return (
                  <button key={tag} type="button" onClick={() => toggleInterest(tag)}
                    className={`px-3.5 py-2 rounded-full text-sm font-bold border transition-all duration-200 ${
                      sel
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-500 border-transparent text-white shadow-lg shadow-purple-600/30 scale-[1.04]"
                        : "bg-gray-100 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/50 hover:border-[#C8102E]/30 hover:text-gray-900 dark:hover:text-white/80"
                    }`}>
                    {tag}
                  </button>
                );
              })}
            </div>

            {form.interests.length > 0 && (
              <p className="text-center text-xs text-fuchsia-400 font-bold">
                {form.interests.length} sélectionné{form.interests.length > 1 ? "s" : ""}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(2)} className={backBtn}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button onClick={() => setStep(4)} disabled={form.interests.length < 3} className={nextBtn}>
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {form.interests.length < 3 && (
              <p className="text-center text-xs text-gray-400 dark:text-white/25">
                {3 - form.interests.length} secteur{3 - form.interests.length > 1 ? "s" : ""} de plus requis
              </p>
            )}
          </div>
        );

      // ── STEP 5 (business only) — Vérification Entreprise (KYB) ──────────────
      case STEP_KYB:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <div className="inline-flex p-3.5 rounded-2xl bg-[#C8102E]/10 mb-3">
                <ShieldCheck className="h-6 w-6 text-[#C8102E]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                Vérification de l'entreprise (KYB)
              </h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">
                Ces informations et documents sont nécessaires pour valider votre compte entreprise
              </p>
            </div>

            <div>
              <label className={lbl}>Fonction du déclarant <span className="text-[#C8102E]">*</span></label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                <select name="role" value={form.role} onChange={field}
                  className={`${inputCls("role", fieldErrors)} pl-10 cursor-pointer appearance-none`}>
                  <option value="">Sélectionner...</option>
                  {BUSINESS_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <FieldError msg={fieldErrors.role} />
            </div>

            <div>
              <label className={lbl}>Personne en charge <span className="text-[#C8102E]">*</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                <input name="personInCharge" value={form.personInCharge} onChange={field}
                  className={`${inputCls("personInCharge", fieldErrors)} pl-10`} placeholder="Nom complet du représentant légal" />
              </div>
              <FieldError msg={fieldErrors.personInCharge} />
            </div>

            <div>
              <label className={lbl}>Email professionnel <span className="text-[#C8102E]">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8102E]/50 pointer-events-none" />
                <input name="companyEmail" type="email" value={form.companyEmail} onChange={field}
                  className={`${inputCls("companyEmail", fieldErrors)} pl-10`} placeholder="contact@entreprise.com" />
              </div>
              <FieldError msg={fieldErrors.companyEmail} />
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[11px] font-extrabold text-gray-400 dark:text-white/30 uppercase tracking-widest">
                Documents justificatifs <span className="text-[#C8102E]">*</span>
              </p>
              {KYB_DOCS.map((doc) => {
                const file = kybFiles[doc.key];
                return (
                  <div key={doc.key} className="p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`shrink-0 p-2 rounded-xl ${file ? "bg-emerald-500/10" : "bg-gray-100 dark:bg-white/[0.05]"}`}>
                        {file ? <FileCheck2 className="h-5 w-5 text-emerald-500" /> : <FileText className="h-5 w-5 text-gray-400 dark:text-white/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{doc.label}</p>
                        <p className="text-[11px] text-gray-400 dark:text-white/30 truncate">
                          {file ? file.name : doc.desc}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold text-[#C8102E] uppercase tracking-wider">
                        {file ? "Changer" : "Choisir"}
                      </span>
                      <input type="file" accept="image/*,application/pdf" className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setKybFiles((p) => ({ ...p, [doc.key]: f }));
                          if (fieldErrors[`kyb_${doc.key}`]) {
                            setFieldErrors((prev) => { const n = { ...prev }; delete n[`kyb_${doc.key}`]; return n; });
                          }
                        }}
                      />
                    </label>
                    <FieldError msg={fieldErrors[`kyb_${doc.key}`]} />
                  </div>
                );
              })}
            </div>

            {Object.keys(fieldErrors).length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400 font-semibold">
                  Veuillez remplir tous les champs et fournir tous les documents requis.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(3)} className={backBtn}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button onClick={() => goNext(STEP_KYB)} className={nextBtn}>
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      // ── STEP — Offre ──────────────────────────────────────────────────────
      case STEP_OFFER: {
        const plans =
          form.accountType === "personal" ? PERSONAL_PLANS :
          form.accountType === "company_creation" ? COMPANY_CREATION_PLANS :
          BUSINESS_PLANS;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <div className="inline-flex p-3.5 rounded-2xl bg-[#C8102E]/10 mb-3">
                <ShieldCheck className="h-6 w-6 text-[#C8102E]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Choisissez votre offre</h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">Accédez à des privilèges exclusifs dès aujourd'hui</p>
            </div>

            <div className={`grid grid-cols-1 ${plans.length === 2 ? "md:grid-cols-2" : plans.length > 2 ? "lg:grid-cols-3" : "max-w-xs mx-auto"} gap-3`}>
              {plans.map((plan) => {
                const sel = form.selectedPlan === plan.id;
                return (
                  <button key={plan.id} onClick={() => setForm((p) => ({ ...p, selectedPlan: plan.id }))}
                    className={`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${
                      sel
                        ? "border-[#C8102E] bg-[#C8102E]/5 shadow-lg shadow-[#C8102E]/10 scale-[1.02]"
                        : "border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/20"
                    }`}>
                    {plan.isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#C8102E] to-[#E8233E] text-white text-[10px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap">
                        Recommandé
                      </div>
                    )}
                    <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                      <span className="text-[11px] text-gray-400 dark:text-white/30 uppercase">{(plan as any).unit || "Dhs/An"}</span>
                    </div>
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {plan.perks.map((perk, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/55">
                          <CheckCircle2 className="h-3 w-3 text-[#C8102E] shrink-0" /> {perk}
                        </li>
                      ))}
                    </ul>
                    <div className={`w-full py-2 rounded-xl text-center text-xs font-bold ${
                      sel ? "bg-[#C8102E] text-white" : "bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/40"
                    }`}>
                      {sel ? "✓ Sélectionné" : "Choisir ce plan"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(form.accountType === "business" ? STEP_KYB : 3)} className={backBtn}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button onClick={() => setStep(STEP_CONFIRM)} className={nextBtn}>
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      }

      // ── STEP — Confirmation & Photo ─────────────────────────────────────────
      case STEP_CONFIRM:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center">
              <div className="inline-flex p-3.5 rounded-2xl bg-[#C8102E]/10 mb-3">
                <Camera className="h-6 w-6 text-[#C8102E]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Finalisez votre profil</h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">Dernière étape — vérifiez vos informations et ajoutez votre photo</p>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] space-y-2.5">
              <p className="text-[11px] font-extrabold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-1">Récapitulatif</p>
              {[
                { label: "Type", value: form.accountType === "personal" ? "Compte Personnel" : "Compte Entreprise" },
                ...(form.accountType === "personal"
                  ? [
                      { label: "Nom complet", value: [form.firstName, form.lastName].filter(Boolean).join(" ") || "—" },
                      { label: "Pièce d'identité", value: form.identityNumber || "—" },
                    ]
                  : [
                      { label: "Entreprise", value: form.companyName || "—" },
                      { label: "RC", value: form.rc || "—" },
                      { label: "Personne en charge", value: form.personInCharge || "—" },
                      { label: "Fonction", value: form.role || "—" },
                      { label: "Documents KYB", value: `${KYB_DOCS.filter((d) => kybFiles[d.key]).length}/${KYB_DOCS.length}` },
                    ]),
                { label: "Ville", value: form.city || "—" },
                { label: "Nationalité", value: form.country || "—" },
                { label: "Téléphone", value: form.phone || "—" },
                { label: "Intérêts", value: `${form.interests.length} sélectionné${form.interests.length > 1 ? "s" : ""}` },
              ].map(({ label: l, value }) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-gray-400 dark:text-white/30">{l}</span>
                  <span className="font-semibold text-gray-700 dark:text-white/70">{value}</span>
                </div>
              ))}
            </div>

            {/* Photo */}
            <div className="flex flex-col items-center gap-4 py-2">
              <ProfileImageUpload
                initialValue={form.avatarUrl}
                onUploadComplete={(url) => setForm((p) => ({ ...p, avatarUrl: url }))}
              />
              <p className="text-xs text-gray-400 dark:text-white/30 text-center max-w-xs">
                Une photo professionnelle augmente votre visibilité de 400% — vous pouvez l'ajouter plus tard.
              </p>
            </div>

            <div className="w-full max-w-xs mx-auto space-y-2">
              {[
                { icon: ShieldCheck, text: "Vérification Premium Inclus" },
                { icon: Zap,         text: "Activation Instantanée" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-3 bg-[#C8102E]/5 border border-[#C8102E]/15 rounded-xl">
                  <Icon className="h-4 w-4 text-[#C8102E] shrink-0" />
                  <span className="text-xs font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider">{text}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {kybError && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {kybError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(STEP_OFFER)} className={backBtn}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button onClick={handleSubmit} disabled={loading} className={nextBtn}>
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><CheckCircle2 className="h-4 w-4" /> Rejoindre The Communium</>}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── page shell ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0e12] relative overflow-hidden">
      {/* Aurora — dark mode only */}
      <div className="fixed inset-0 pointer-events-none -z-10 hidden dark:block">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-gray-200 dark:bg-white/[0.05] z-50">
        <div
          className="h-full bg-gradient-to-r from-[#C8102E] to-[#E8233E] transition-all duration-500"
          style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-14 pb-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <img src="/communium_logo.png" alt="The Communium" width={28} height={28} className="rounded" />
            <span className="text-xs font-extrabold text-[#C8102E] tracking-widest uppercase opacity-80">
              The Communium
            </span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEP_LABELS.map((stepLbl, i) => {
            const s = i + 1;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all duration-300 ${
                    done   ? "bg-[#C8102E] border-[#C8102E] text-white" :
                    active ? "bg-[#C8102E]/10 border-[#C8102E] text-[#C8102E]" :
                             "bg-gray-200 border-gray-300 text-gray-400 dark:bg-white/[0.04] dark:border-white/[0.1] dark:text-white/30"
                  }`}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s}
                  </div>
                  <span className={`text-[9px] font-bold uppercase mt-1.5 tracking-widest whitespace-nowrap ${
                    active ? "text-[#C8102E]" : "text-gray-400 dark:text-white/20"
                  }`}>
                    {stepLbl}
                  </span>
                </div>
                {s < STEP_LABELS.length && (
                  <div className={`w-6 sm:w-10 h-px mx-1 mb-4 transition-colors ${step > s ? "bg-[#C8102E]/60" : "bg-gray-200 dark:bg-white/[0.07]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#13141a] border border-gray-200 dark:border-white/[0.08] rounded-3xl shadow-lg dark:shadow-black/50 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8102E]/30 to-transparent" />
          {renderStep()}
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-gray-400 dark:text-white/20 mt-5">
          Étape {step} sur {STEP_LABELS.length}
        </p>
      </div>
    </div>
  );
}
