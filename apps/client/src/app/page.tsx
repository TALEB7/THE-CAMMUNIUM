"use client";

import Link from "next/link";
import Image from "next/image";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useT } from "@/lib/i18n";

/* ───── tiny SVG helper for the network diagram ───── */
function NetworkDiagram() {
  return (
    <svg viewBox="0 0 200 180" className="w-48 h-44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* lines */}
      <line x1="100" y1="30" x2="50" y2="80" stroke="#c9a730" strokeWidth="1.5" />
      <line x1="100" y1="30" x2="150" y2="80" stroke="#c9a730" strokeWidth="1.5" />
      <line x1="50" y1="80" x2="100" y2="130" stroke="#c9a730" strokeWidth="1.5" />
      <line x1="150" y1="80" x2="100" y2="130" stroke="#c9a730" strokeWidth="1.5" />
      <line x1="50" y1="80" x2="20" y2="140" stroke="#d4c088" strokeWidth="1" />
      <line x1="150" y1="80" x2="180" y2="140" stroke="#d4c088" strokeWidth="1" />
      <line x1="100" y1="130" x2="60" y2="165" stroke="#d4c088" strokeWidth="1" />
      <line x1="100" y1="130" x2="140" y2="165" stroke="#d4c088" strokeWidth="1" />
      {/* nodes */}
      <circle cx="100" cy="30" r="14" fill="#1a237e" />
      <circle cx="50" cy="80" r="12" fill="#3949ab" />
      <circle cx="150" cy="80" r="12" fill="#3949ab" />
      <circle cx="100" cy="130" r="14" fill="#c9a730" />
      <circle cx="20" cy="140" r="8" fill="#7986cb" />
      <circle cx="180" cy="140" r="8" fill="#7986cb" />
      <circle cx="60" cy="165" r="8" fill="#d4c088" />
      <circle cx="140" cy="165" r="8" fill="#d4c088" />
      {/* person icons (simplified) */}
      <text x="100" y="35" textAnchor="middle" fontSize="14" fill="white">👤</text>
      <text x="50" y="85" textAnchor="middle" fontSize="12" fill="white">👤</text>
      <text x="150" y="85" textAnchor="middle" fontSize="12" fill="white">👤</text>
      <text x="100" y="135" textAnchor="middle" fontSize="14" fill="white">👤</text>
    </svg>
  );
}



export default function HomePage() {
  const { t } = useT();
  const h = t.home;

  return (
    <div className="min-h-screen bg-[#f8f6f0] flex flex-col">
      {/* ══════════ NAVBAR ══════════ */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          {/* Logo + Brand */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/communium_logo.png"
              alt="The Communium"
              width={52}
              height={52}
              className="rounded"
              priority
            />
            <div className="hidden sm:block leading-tight">
              <span className="block text-lg font-extrabold text-[#1a237e] font-heading tracking-wider uppercase">
                The Communium
              </span>
              <span className="block text-[10px] text-gray-400 tracking-widest uppercase">
                {h.subtitle}
              </span>
            </div>
          </Link>

          {/* Nav links + Language switcher + CTA */}
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-6">
              <Link href="#about" className="text-sm font-medium text-gray-600 hover:text-[#1a237e] transition-colors whitespace-nowrap">
                {h.navAbout}
              </Link>
              <Link href="#membership" className="text-sm font-medium text-gray-600 hover:text-[#1a237e] transition-colors whitespace-nowrap">
                {h.navMembership}
              </Link>
              <LanguageSwitcher />
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#1a237e] transition-colors">
                    {h.signIn}
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1a237e] rounded-lg hover:bg-[#283593] transition-colors shadow-sm">
                    {h.applyToJoin}
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1a237e] rounded-lg hover:bg-[#283593] transition-colors shadow-sm"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO — split layout ══════════ */}
      <section className="flex-1">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-0 min-h-[520px]">
          {/* Left — text */}
          <div className="flex flex-col justify-center px-8 lg:px-14 py-14 lg:py-20 bg-[#f0ede4]">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-[#1a237e] leading-tight font-heading tracking-wide uppercase mb-6">
              {h.heroTitle}
            </h1>
            <p className="text-base text-gray-600 mb-6 max-w-lg leading-relaxed">
              {h.heroDesc}
            </p>
            <ul className="space-y-2 mb-8 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#1a237e]">•</span>
                {h.bullet1}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#1a237e]">•</span>
                {h.bullet2}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#1a237e]">•</span>
                {h.bullet3}
              </li>
            </ul>
            <div className="flex gap-3">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="px-6 py-3 text-sm font-semibold text-white bg-[#1a237e] rounded-lg hover:bg-[#283593] transition shadow-md">
                    {h.joinCommunity}
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 text-sm font-semibold text-white bg-[#1a237e] rounded-lg hover:bg-[#283593] transition shadow-md"
                >
                  {h.goToDashboard}
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* Right — hero image */}
          <div className="relative hidden lg:block min-h-[420px]">
            <Image
              src="/hero-meeting.jpg"
              alt="The Communium"
              fill
              className="object-cover"
              priority
              sizes="50vw"
            />
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="about" className="bg-[#f8f6f0] py-16">
        <div className="max-w-6xl mx-auto px-8 space-y-16">
          {/* Feature 1 — Verified Quality Network */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* avatars cluster */}
            <div className="shrink-0">
              <div className="flex -space-x-3 mb-3">
                {[
                  "bg-gray-400",
                  "bg-[#8d6e63]",
                  "bg-[#5c6bc0]",
                  "bg-[#c9a730]",
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 text-xs font-semibold text-green-600">
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-green-500 text-white text-[8px] flex items-center justify-center leading-none">✓</span>
                  {h.verified}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-green-500 text-white text-[8px] flex items-center justify-center leading-none">✓</span>
                  {h.verified}
                </span>
              </div>
            </div>
            {/* text */}
            <div>
              <h2 className="text-xl font-bold text-[#1a237e] font-heading mb-2">
                {h.verifiedNetworkTitle}
              </h2>
              <p className="text-gray-600 max-w-md leading-relaxed">
                {h.verifiedNetworkDesc}
              </p>
            </div>
          </div>

          {/* Feature 2 — AI-Enhanced Matching */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-10">
            {/* text */}
            <div>
              <h2 className="text-xl font-bold text-[#1a237e] font-heading mb-2">
                {h.aiMatchingTitle}
              </h2>
              <p className="text-gray-600 max-w-md leading-relaxed">
                {h.aiMatchingDesc}
              </p>
            </div>
            {/* network diagram */}
            <div className="shrink-0">
              <NetworkDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ MEMBERSHIP TIERS (cards) ══════════ */}
      <section id="membership" className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-2xl font-extrabold text-[#1a237e] font-heading text-center mb-2 tracking-wide">
            {h.membershipTitle}
          </h2>
          <p className="text-center text-gray-500 mb-10">
            {h.membershipSubtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-4">
            {/* Personnel */}
            <div className="ygo-card ygo-shimmer p-8 border-2 border-[#c9a730] relative overflow-visible">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rarity-ultra text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap z-10">
                {h.popular}
              </div>
              <h3 className="text-xl font-bold text-[#1a237e] mb-1 font-heading">{h.planPersonal}</h3>
              <p className="text-sm text-gray-500 mb-4">{h.planPersonalDesc}</p>
              <p className="text-3xl font-bold text-[#1a237e] mb-6 font-heading">
                {h.planPersonalPrice} <span className="text-lg font-normal text-gray-500">{h.perYear}</span>
              </p>
              <ul className="space-y-3 mb-8 text-sm text-gray-600">
                {h.personalFeatures.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="text-[#c9a730]">★</span>
                    {p}
                  </li>
                ))}
              </ul>
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="w-full ygo-btn-gold py-3">{h.startNow}</button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/onboarding" className="block w-full ygo-btn-gold py-3 text-center">
                  {h.choose}
                </Link>
              </SignedIn>
            </div>

            {/* Business */}
            <div className="ygo-card ygo-shimmer p-8 border border-[#b0bec5] relative">
              <h3 className="text-xl font-bold text-[#1a237e] mb-1 font-heading">{h.planBusiness}</h3>
              <p className="text-sm text-gray-500 mb-4">{h.planBusinessDesc}</p>
              <p className="text-3xl font-bold text-[#1a237e] mb-6 font-heading">
                {h.planBusinessPrice} <span className="text-lg font-normal text-gray-500">{h.perYear}</span>
              </p>
              <ul className="space-y-3 mb-8 text-sm text-gray-600">
                {h.businessFeatures.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="text-[#3949ab]">★</span>
                    {p}
                  </li>
                ))}
              </ul>
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="w-full ygo-btn-blue py-3">{h.startNow}</button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/onboarding" className="block w-full ygo-btn-blue py-3 text-center">
                  {h.choose}
                </Link>
              </SignedIn>
            </div>

            {/* Création d'entreprise */}
            <div className="ygo-card ygo-shimmer p-8 border border-[#b0bec5] relative">
              <h3 className="text-xl font-bold text-[#1a237e] mb-1 font-heading">{h.planCreation}</h3>
              <p className="text-sm text-gray-500 mb-4">{h.planCreationDesc}</p>
              <p className="text-3xl font-bold text-[#1a237e] mb-6 font-heading">
                {h.planCreationPrice} <span className="text-lg font-normal text-gray-500">Dhs</span>
              </p>
              <ul className="space-y-3 mb-8 text-sm text-gray-600">
                {h.creationFeatures.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="text-[#c9a730]">★</span>
                    {p}
                  </li>
                ))}
              </ul>
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="w-full ygo-btn-gold py-3">{h.startNow}</button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/onboarding" className="block w-full ygo-btn-gold py-3 text-center">
                  {h.choose}
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-[#f0ede4] border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>{h.copyright}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#1a237e] transition-colors">
              {h.dataPrivacy}
            </Link>
            <Link href="/contact" className="hover:text-[#1a237e] transition-colors">
              {h.contact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
