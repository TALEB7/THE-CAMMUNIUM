'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  MessagesSquare,
  Users2,
  Calendar,
  Link2,
  GraduationCap,
  BarChart3,
  Megaphone,
  ShoppingBag,
  Gavel,
  GitCompareArrows,
  BellRing,
  Search,
  Building2,
  Award,
  Bookmark,
  HelpCircle,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

function Dropdown({
  label,
  items,
}: {
  label: string;
  items: { name: string; href: string; icon: any }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-[#1a237e] hover:bg-[#f5f0e1] rounded-lg transition-all"
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#c9a730] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-[#d4c088]/30 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-[#faf6e9] hover:text-[#1a237e] transition-colors"
            >
              <item.icon className="w-4 h-4 text-[#c9a730]" />
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function HeaderDropdowns() {
  const { t } = useT();

  const communaute = [
    { name: t.nav.forums, href: '/forums', icon: MessagesSquare },
    { name: t.nav.groups, href: '/groups', icon: Users2 },
    { name: t.nav.events, href: '/events', icon: Calendar },
    { name: t.nav.connections, href: '/connections', icon: Link2 },
    { name: t.nav.mentorship, href: '/mentorship', icon: GraduationCap },
    { name: t.nav.polls, href: '/polls', icon: BarChart3 },
    { name: t.nav.announcements, href: '/announcements', icon: Megaphone },
  ];

  const commerce = [
    { name: t.nav.marketplace, href: '/marketplace', icon: ShoppingBag },
    { name: t.nav.auctions, href: '/auctions', icon: Gavel },
    { name: t.nav.comparisons, href: '/comparisons', icon: GitCompareArrows },
    { name: t.nav.priceAlerts, href: '/alerts', icon: BellRing },
  ];

  const outils = [
    { name: t.nav.search, href: '/search', icon: Search },
    { name: t.nav.companyCreation, href: '/company-creation', icon: Building2 },
    { name: t.nav.badges, href: '/badges', icon: Award },
    { name: t.nav.bookmarks, href: '/bookmarks', icon: Bookmark },
    { name: t.nav.helpCenter, href: '/faq', icon: HelpCircle },
  ];

  return (
    <div className="hidden md:flex items-center gap-1">
      <Dropdown label={t.nav.community} items={communaute} />
      <Dropdown label={t.nav.commerce} items={commerce} />
      <Dropdown label={t.nav.tools} items={outils} />
    </div>
  );
}
