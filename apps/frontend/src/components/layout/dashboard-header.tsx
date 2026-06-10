'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { SignedIn, SignedOut } from '@/lib/auth-client';
import { UserProfileCard } from '@/components/layout/user-profile-card';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ModeToggle } from '@/components/mode-toggle';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useNotificationBadge } from '@/hooks/use-notification-badge';
import { useTokenBalance } from '@/hooks/use-token-balance';
import { useT } from '@/lib/i18n';
import {
  Home, Users2, ShoppingBag, MessageSquare, Bell, ChevronDown,
  Search, MessagesSquare, Calendar, Link2, GraduationCap, BarChart3,
  Megaphone, Gavel, GitCompareArrows, BellRing, Building2, Award,
  Bookmark, HelpCircle, Grid3x3,
} from 'lucide-react';

// ── LinkedIn-style nav tab ──────────────────────────────────────────────────
function NavTab({
  href, icon: Icon, label, badge,
}: {
  href: string; icon: any; label: string; badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center justify-center gap-0.5 px-4 h-14 text-xs font-medium transition-colors group
        ${active
          ? 'text-foreground border-b-2 border-foreground'
          : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
        }`}
    >
      <div className="relative">
        <Icon className="h-5 w-5" />
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-[#C8102E] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="hidden lg:block">{label}</span>
    </Link>
  );
}

// ── LinkedIn-style dropdown tab ─────────────────────────────────────────────
function DropdownTab({
  icon: Icon, label, items,
}: {
  icon: any; label: string;
  items: { name: string; href: string; icon: any }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative h-14 flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className={`flex flex-col items-center justify-center gap-0.5 px-4 h-14 text-xs font-medium transition-colors border-b-2
          ${open ? 'text-foreground border-foreground' : 'text-muted-foreground hover:text-foreground border-transparent'}`}
      >
        <div className="flex flex-col items-center gap-0.5">
          <Icon className="h-5 w-5" />
          <span className="hidden lg:flex items-center gap-0.5">
            {label} <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-56 bg-card border border-border rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <item.icon className="w-4 h-4 text-primary shrink-0" />
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main header ─────────────────────────────────────────────────────────────
export function DashboardHeader() {
  const { t } = useT();
  const { unread } = useNotificationBadge();
  const { balance } = useTokenBalance();

  const communaute = [
    { name: t.nav.forums,        href: '/forums',       icon: MessagesSquare },
    { name: t.nav.groups,        href: '/groups',       icon: Users2 },
    { name: t.nav.events,        href: '/events',       icon: Calendar },
    { name: t.nav.connections,   href: '/connections',  icon: Link2 },
    { name: t.nav.mentorship,    href: '/mentorship',   icon: GraduationCap },
    { name: t.nav.polls,         href: '/polls',        icon: BarChart3 },
    { name: t.nav.announcements, href: '/announcements',icon: Megaphone },
  ];

  const commerce = [
    { name: t.nav.marketplace,  href: '/marketplace',  icon: ShoppingBag },
    { name: t.nav.auctions,     href: '/auctions',     icon: Gavel },
    { name: t.nav.comparisons,  href: '/comparisons',  icon: GitCompareArrows },
    { name: t.nav.priceAlerts,  href: '/alerts',       icon: BellRing },
  ];

  const outils = [
    { name: t.nav.search,          href: '/search',          icon: Search },
    { name: t.nav.companyCreation, href: '/company-creation', icon: Building2 },
    { name: t.nav.badges,          href: '/badges',           icon: Award },
    { name: t.nav.bookmarks,       href: '/bookmarks',        icon: Bookmark },
    { name: t.nav.helpCenter,      href: '/faq',              icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-30 bg-card dark:bg-[#0a0a0a]/95 dark:backdrop-blur-xl border-b border-border dark:border-[#1a1a1a]">
      <div className="flex items-center h-14 px-3 sm:px-4 gap-2">

        {/* ── LEFT: Mobile + Logo + Search + Messages + Notifications + Profile ── */}
        <div className="flex items-center gap-2 shrink-0">
          <MobileNav />

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <Image src="/communium_logo.png" alt="The Communium" width={34} height={34} className="rounded object-contain" />
            <span className="hidden xl:block text-base font-extrabold text-primary font-heading tracking-wider uppercase whitespace-nowrap">
              The Communium
            </span>
          </Link>

          {/* Search bar */}
          <Link
            href="/search"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted dark:bg-[#1a1a1a] rounded-full text-sm text-muted-foreground hover:bg-accent transition-colors w-40 lg:w-52"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">{t.header.searchTooltip}</span>
          </Link>

          {/* Profile — right next to search */}
          <div className="hidden sm:block">
            <SignedIn><UserProfileCard /></SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="text-sm text-primary hover:text-primary/80 font-semibold px-2">
                {t.header.signIn}
              </Link>
            </SignedOut>
          </div>
        </div>

        {/* ── CENTER: Nav tabs (no messages/notifs — moved left) ── */}
        <nav className="hidden md:flex items-center flex-1 justify-center gap-0">
          <NavTab href="/feed"         icon={Home}           label="Accueil" />
          <DropdownTab icon={Users2}      label={t.nav.community} items={communaute} />
          <DropdownTab icon={ShoppingBag} label={t.nav.commerce}  items={commerce} />
          <DropdownTab icon={Grid3x3}     label={t.nav.tools}     items={outils} />
        </nav>

        {/* ── RIGHT: Messages + Notifications + Tks + ModeToggle + Language ── */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">

          {/* Messages */}
          <Link
            href="/messages"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-[#1a1a1a] transition-all"
            title={t.header.messagesTooltip}
          >
            <MessageSquare className="h-5 w-5" />
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-[#1a1a1a] transition-all"
            title={t.header.notificationsTooltip}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 bg-[#C8102E] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Tks */}
          <Link
            href="/tokens"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-primary hover:bg-accent rounded-full transition-all whitespace-nowrap"
          >
            <span>★</span>
            <span>{balance.toLocaleString('fr-FR')} Tks</span>
          </Link>

          <div className="w-px h-5 bg-border hidden sm:block mx-0.5" />
          <ModeToggle />
          <LanguageSwitcher />
        </div>

      </div>
    </header>
  );
}
