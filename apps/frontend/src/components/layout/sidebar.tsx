'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, LayoutDashboard, User,
  ShoppingBag, MessagesSquare,
  Search, Settings, Coins, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-client';

function NavIcon({ href, icon: Icon, label, exact = false }: {
  href: string; icon: any; label: string; exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      title={label}
      className={cn(
        'group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
        active
          ? 'bg-primary text-black shadow-md shadow-primary/20'
          : 'text-muted-foreground hover:bg-muted dark:hover:bg-[#1a1a1a] hover:text-foreground',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-popover border border-border text-foreground text-xs font-medium whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        {label}
      </span>
    </Link>
  );
}

function Divider() {
  return <div className="w-8 border-t border-border/40 dark:border-[#1a1a1a] my-1 mx-auto" />;
}

export function Sidebar() {
  const { t } = useT();
  const { signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col items-center w-16 shrink-0 border-r border-border bg-card dark:bg-[#0a0a0a] dark:border-[#1a1a1a] py-3 gap-1 h-[calc(100vh-56px)] sticky top-14">

      {/* Main */}
      <NavIcon href="/feed"      icon={Home}            label="Accueil" exact />
      <NavIcon href="/dashboard" icon={LayoutDashboard} label={t.nav.dashboard} exact />
      <NavIcon href="/profile"   icon={User}            label={t.nav.profile} />

      <Divider />

      {/* Community & Commerce — les plus utilisés */}
      <NavIcon href="/forums"      icon={MessagesSquare} label={t.nav.forums} />
      <NavIcon href="/marketplace" icon={ShoppingBag}   label={t.nav.marketplace} />

      <Divider />

      {/* Outils */}
      <NavIcon href="/search"   icon={Search}   label={t.nav.search} />
      <NavIcon href="/tokens"   icon={Coins}    label={t.nav.tokens} />
      <NavIcon href="/settings" icon={Settings} label={t.nav.settings} />

      {/* Logout en bas */}
      <div className="flex-1" />
      <Divider />
      <button
        onClick={() => signOut()}
        title="Se déconnecter"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </aside>
  );
}
