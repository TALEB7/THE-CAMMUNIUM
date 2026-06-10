'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, ShoppingBag, Bell, User } from 'lucide-react';
import { useNotificationBadge } from '@/hooks/use-notification-badge';
import { cn } from '@/lib/utils';

const items = [
  { href: '/feed',      icon: Home,          label: 'Accueil' },
  { href: '/dashboard', icon: LayoutDashboard,label: 'Tableau' },
  { href: '/marketplace',icon: ShoppingBag,   label: 'Marché' },
  { href: '/notifications',icon: Bell,         label: 'Notifs', badge: true },
  { href: '/profile',   icon: User,           label: 'Profil' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { unread } = useNotificationBadge();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border lg:hidden">
      <div className="flex items-center">
        {items.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badge && unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-[#C8102E] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
              {active && <div className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
