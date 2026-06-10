"use client";

import Link from "next/link";
import Image from "next/image";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@/lib/auth-client";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useT } from "@/lib/i18n";
import { ModeToggle } from "@/components/mode-toggle";

/* ───── tiny SVG helper for the network diagram ───── */
function NetworkDiagram() {
  return (
    <svg viewBox="0 0 200 180" className="w-48 h-44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* lines */}
      <line x1="100" y1="30" x2="50" y2="80" stroke="currentColor" className="text-primary" strokeWidth="1.5" />
      <line x1="100" y1="30" x2="150" y2="80" stroke="currentColor" className="text-primary" strokeWidth="1.5" />
      <line x1="50" y1="80" x2="100" y2="130" stroke="currentColor" className="text-primary" strokeWidth="1.5" />
      <line x1="150" y1="80" x2="100" y2="130" stroke="currentColor" className="text-primary" strokeWidth="1.5" />
      <line x1="50" y1="80" x2="20" y2="140" stroke="currentColor" className="text-muted-foreground" strokeWidth="1" />
      <line x1="150" y1="80" x2="180" y2="140" stroke="currentColor" className="text-muted-foreground" strokeWidth="1" />
      <line x1="100" y1="130" x2="60" y2="165" stroke="currentColor" className="text-muted-foreground" strokeWidth="1" />
      <line x1="100" y1="130" x2="140" y2="165" stroke="currentColor" className="text-muted-foreground" strokeWidth="1" />
      {/* nodes */}
      <circle cx="100" cy="30" r="14" className="fill-primary" />
      <circle cx="50" cy="80" r="12" className="fill-primary/70" />
      <circle cx="150" cy="80" r="12" className="fill-primary/70" />
      <circle cx="100" cy="130" r="14" className="fill-primary" />
      <circle cx="20" cy="140" r="8" className="fill-muted-foreground" />
      <circle cx="180" cy="140" r="8" className="fill-muted-foreground" />
      <circle cx="60" cy="165" r="8" className="fill-primary/50" />
      <circle cx="140" cy="165" r="8" className="fill-primary/50" />
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
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      {/* ══════════ NAVBAR ══════════ */}
      <nav className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          {/* Logo + Brand */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/communium_logo.png"
              alt="The Communium"
              width="52"
              height="52"
              className="rounded object-contain"
            />
            <div className="hidden sm:block leading-tight">
              <span className="block text-lg font-extrabold text-primary font-heading tracking-wider uppercase">
                The Communium
              </span>
              <span className="block text-[10px] text-muted-foreground tracking-widest uppercase">
                {h.subtitle}
              </span>
            </div>
          </Link>

          {/* Nav links + Language switcher + CTA */}
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-6">
              <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                {h.navAbout}
              </Link>
              <Link href="#membership" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                {h.navMembership}
              </Link>
              <ModeToggle />
              <LanguageSwitcher />
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    {h.signIn}
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:brightness-110 transition-all shadow-sm">
                    {h.applyToJoin}
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:brightness-110 transition-all shadow-sm"
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
          <div className="flex flex-col justify-center px-8 lg:px-14 py-14 lg:py-20">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-foreground leading-tight font-heading tracking-wide uppercase mb-6">
              {h.heroTitle}
            </h1>
            <p className="text-base text-muted-foreground mb-6 max-w-lg leading-relaxed">
              {h.heroDesc}
            </p>
            <ul className="space-y-2 mb-8 text-foreground/80 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                {h.bullet1}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                {h.bullet2}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                {h.bullet3}
              </li>
            </ul>
            <div className="flex gap-3">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:brightness-110 transition shadow-md">
                    {h.joinCommunity}
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:brightness-110 transition shadow-md"
                >
                  {h.goToDashboard}
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* Right — hero image */}
          <div className="relative hidden lg:block min-h-[420px] rounded-r-2xl overflow-hidden border border-border">
            <img
              src="/hero-meeting.jpg"
              alt="The Communium"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="about" className="bg-background py-16">
        <div className="max-w-6xl mx-auto px-8 space-y-16">
          {/* Feature 1 — Verified Quality Network */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* avatars cluster */}
            <div className="shrink-0">
              <div className="flex -space-x-3 mb-3">
                {[
                  "bg-muted-foreground",
                  "bg-amber-700",
                  "bg-indigo-500",
                  "bg-primary",
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-full ${bg} border-2 border-background flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 text-xs font-semibold text-green-500">
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
              <h2 className="text-xl font-bold text-foreground font-heading mb-2">
                {h.verifiedNetworkTitle}
              </h2>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                {h.verifiedNetworkDesc}
              </p>
            </div>
          </div>

          {/* Feature 2 — AI-Enhanced Matching */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-10">
            {/* text */}
            <div>
              <h2 className="text-xl font-bold text-primary font-heading mb-2">
                {h.aiMatchingTitle}
              </h2>
              <p className="text-muted-foreground max-w-md leading-relaxed">
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
      <section id="membership" className="bg-background py-16 border-t border-border/10">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-2xl font-extrabold text-foreground font-heading text-center mb-2 tracking-wide">
            {h.membershipTitle}
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            {h.membershipSubtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-4">
            {/* Personnel */}
            <div className="ygo-card ygo-shimmer p-8 border-2 border-primary/40 relative overflow-visible transform hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rarity-ultra text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap z-10">
                {h.popular}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1 font-heading">{h.planPersonal}</h3>
              <p className="text-sm text-muted-foreground mb-4">{h.planPersonalDesc}</p>
              <p className="text-3xl font-bold text-foreground mb-6 font-heading">
                {h.planPersonalPrice} <span className="text-lg font-normal text-muted-foreground">{h.perYear}</span>
              </p>
              <ul className="space-y-3 mb-8 text-sm text-foreground/80">
                {h.personalFeatures.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="text-primary">★</span>
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
            <div className="ygo-card ygo-shimmer p-8 border border-border relative transform hover:-translate-y-2 transition-transform duration-500">
              <h3 className="text-xl font-bold text-foreground mb-1 font-heading">{h.planBusiness}</h3>
              <p className="text-sm text-muted-foreground mb-4">{h.planBusinessDesc}</p>
              <p className="text-3xl font-bold text-foreground mb-6 font-heading">
                {h.planBusinessPrice} <span className="text-lg font-normal text-muted-foreground">{h.perYear}</span>
              </p>
              <ul className="space-y-3 mb-8 text-sm text-foreground/80">
                {h.businessFeatures.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="text-primary/70">★</span>
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
            <div className="ygo-card ygo-shimmer p-8 border border-border relative transform hover:-translate-y-2 transition-transform duration-500">
              <h3 className="text-xl font-bold text-foreground mb-1 font-heading">{h.planCreation}</h3>
              <p className="text-sm text-muted-foreground mb-4">{h.planCreationDesc}</p>
              <p className="text-3xl font-bold text-foreground mb-6 font-heading">
                {h.planCreationPrice} <span className="text-lg font-normal text-muted-foreground">$</span>
              </p>
              <ul className="space-y-3 mb-8 text-sm text-foreground/80">
                {h.creationFeatures.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="text-primary">★</span>
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
      <footer className="bg-card border-t border-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{h.copyright}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              {h.dataPrivacy}
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              {h.contact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
