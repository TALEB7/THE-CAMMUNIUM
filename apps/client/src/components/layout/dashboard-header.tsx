'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { UserProfileCard } from '@/components/layout/user-profile-card';
import { HeaderDropdowns } from '@/components/layout/header-dropdowns';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { MessageSquare, Bell, Search } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function DashboardHeader() {
  const { t } = useT();

  return (
    <header className="sticky top-0 z-30 bg-white border-b-2 border-[#c9a730]/60">
      <div className="flex items-center justify-between px-6 py-3">
        {/* LEFT — Brand + Profile */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/communium_logo.png"
              alt="The Communium"
              width={36}
              height={36}
              className="rounded"
              priority
            />
            <div className="hidden sm:block">
              <span className="text-lg font-extrabold text-[#1a237e] font-heading tracking-wider uppercase">
                The Communium
              </span>
              <div className="h-0.5 bg-gradient-to-r from-[#c9a730] via-[#e6c200] to-transparent" />
            </div>
          </Link>
          <div className="w-px h-6 bg-[#c9a730]/20 hidden sm:block" />
          <SignedIn>
            <UserProfileCard />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="text-sm text-[#c9a730] hover:text-[#e6c200] font-semibold">
              {t.header.signIn}
            </Link>
          </SignedOut>
          <div className="w-px h-6 bg-[#c9a730]/20 hidden md:block" />
          <HeaderDropdowns />
        </div>

        {/* RIGHT — Quick actions */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <div className="w-px h-6 bg-[#c9a730]/20 mx-1 hidden sm:block" />
          <Link
            href="/search"
            className="p-2 text-gray-400 hover:text-[#1a237e] hover:bg-[#f5f0e1] rounded-lg transition-all"
            title={t.header.searchTooltip}
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/messages"
            className="relative p-2 text-gray-400 hover:text-[#1a237e] hover:bg-[#f5f0e1] rounded-lg transition-all"
            title={t.header.messagesTooltip}
          >
            <MessageSquare className="h-5 w-5" />
          </Link>
          <Link
            href="/notifications"
            className="relative p-2 text-gray-400 hover:text-[#1a237e] hover:bg-[#f5f0e1] rounded-lg transition-all"
            title={t.header.notificationsTooltip}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
          <div className="w-px h-6 bg-[#c9a730]/20 mx-1 hidden sm:block" />
          <Link
            href="/tokens"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#c9a730] hover:bg-[#f5f0e1] rounded-lg transition-all"
          >
            <span>★</span>
            <span>0 Tks</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
