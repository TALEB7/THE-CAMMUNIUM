'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-client';
import { useT } from '@/lib/i18n';
import {
  LayoutDashboard, User, ShoppingBag, Gavel, Settings, Coins, CreditCard,
  GraduationCap, Shield, Search, Building2, GitCompareArrows, BellRing,
  MessagesSquare, Calendar, Users2, Link2, Activity, Award, BarChart3,
  Bookmark, Megaphone, HelpCircle, MessageSquareQuote, Mail,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  '/dashboard': LayoutDashboard, '/feed': Activity, '/profile': User,
  '/forums': MessagesSquare, '/groups': Users2, '/events': Calendar,
  '/connections': Link2, '/mentorship': GraduationCap, '/polls': BarChart3,
  '/announcements': Megaphone, '/testimonials': MessageSquareQuote,
  '/marketplace': ShoppingBag, '/auctions': Gavel, '/comparisons': GitCompareArrows,
  '/alerts': BellRing, '/search': Search, '/company-creation': Building2,
  '/badges': Award, '/bookmarks': Bookmark, '/faq': HelpCircle,
  '/contact': Mail, '/tokens': Coins, '/membership': CreditCard,
  '/admin': Shield, '/settings': Settings,
};

function useSections() {
  const { t } = useT();
  return [
    {
      label: null,
      items: [
        { name: t.nav.dashboard, href: '/dashboard' },
        { name: t.nav.feed, href: '/feed' },
        { name: t.nav.profile, href: '/profile' },
      ],
    },
    {
      label: t.nav.community,
      items: [
        { name: t.nav.forums, href: '/forums' },
        { name: t.nav.groups, href: '/groups' },
        { name: t.nav.events, href: '/events' },
        { name: t.nav.connections, href: '/connections' },
        { name: t.nav.mentorship, href: '/mentorship' },
        { name: t.nav.polls, href: '/polls' },
        { name: t.nav.announcements, href: '/announcements' },
        { name: t.nav.testimonials, href: '/testimonials' },
      ],
    },
    {
      label: t.nav.commerce,
      items: [
        { name: t.nav.marketplace, href: '/marketplace' },
        { name: t.nav.auctions, href: '/auctions' },
        { name: t.nav.comparisons, href: '/comparisons' },
        { name: t.nav.priceAlerts, href: '/alerts' },
      ],
    },
    {
      label: t.nav.tools,
      items: [
        { name: t.nav.search, href: '/search' },
        { name: t.nav.companyCreation, href: '/company-creation' },
        { name: t.nav.badges, href: '/badges' },
        { name: t.nav.bookmarks, href: '/bookmarks' },
        { name: t.nav.helpCenter, href: '/faq' },
        { name: t.nav.contact, href: '/contact' },
      ],
    },
    {
      label: t.nav.account,
      items: [
        { name: t.nav.tokens, href: '/tokens' },
        { name: t.nav.membership, href: '/membership' },
        { name: t.nav.admin, href: '/admin' },
        { name: t.nav.settings, href: '/settings' },
      ],
    },
  ];
}

function Section({
  label,
  items,
  pathname,
  onClose,
}: {
  label: string | null;
  items: { name: string; href: string }[];
  pathname: string;
  onClose: () => void;
}) {
  const hasActive = items.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'));
  const [open, setOpen] = useState(hasActive || !label);

  return (
    <div>
      {label && (
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-3 py-2 mt-2"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 dark:text-[#808080]">
            {label}
          </span>
          <ChevronDown className={cn('h-3 w-3 text-primary/40 transition-transform', open ? '' : '-rotate-90')} />
        </button>
      )}
      {open && (
        <div className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = iconMap[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] transition-all',
                  isActive
                    ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20'
                    : 'text-muted-foreground dark:text-[#b0b0b0] hover:bg-muted dark:hover:bg-[#1a1a1a] hover:text-foreground dark:hover:text-white',
                )}
              >
                {Icon && <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-black' : 'text-muted-foreground dark:text-[#b0b0b0]')} />}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sections = useSections();
  const { signOut } = useAuth();
  const { t } = useT();

  return (
    <>
      {/* Hamburger button — only on < lg */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-all"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-card dark:bg-[#0a0a0a] border-r border-border dark:border-[#1a1a1a] flex flex-col transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-[#1a1a1a]">
          <span className="text-base font-extrabold text-primary font-heading tracking-wider uppercase">
            The Communium
          </span>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {sections.map((section, i) => (
            <div key={section.label || 'top'}>
              {i > 0 && section.label && (
                <div className="mx-3 my-1 border-t border-border/40 dark:border-[#1a1a1a]" />
              )}
              <Section label={section.label} items={section.items} pathname={pathname} onClose={() => setOpen(false)} />
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/40 dark:border-[#1a1a1a] px-4 py-3 space-y-2">
          <button
            onClick={() => { signOut(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full text-left font-medium text-destructive hover:text-destructive/80 transition-colors py-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-[13px]">{t.header?.signOut || 'Se déconnecter'}</span>
          </button>
          <p className="text-[10px] text-muted-foreground font-heading tracking-wide uppercase">
            &copy; 2026 The Communium
          </p>
        </div>
      </aside>
    </>
  );
}
