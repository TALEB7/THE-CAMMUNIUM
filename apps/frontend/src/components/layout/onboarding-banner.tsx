'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-client';
import { api } from '@/lib/api';
import { X, User, Users, ShoppingBag, MessageSquare } from 'lucide-react';

const STEPS = [
  { icon: User,         label: 'Compléter votre profil',      href: '/profile/edit',  key: 'profile' },
  { icon: Users,        label: 'Trouver vos premières connexions', href: '/connections', key: 'connections' },
  { icon: ShoppingBag, label: 'Publier une annonce',          href: '/marketplace/new', key: 'listing' },
  { icon: MessageSquare,label: 'Participer à un forum',        href: '/forums',        key: 'forum' },
];

export function OnboardingBanner() {
  const { userId } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('onboarding-dismissed')) setDismissed(true);
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['onboarding-stats', userId],
    queryFn: () => api.get(`/analytics/dashboard/${userId}`).then((r) => r.data?.stats),
    enabled: !!userId && !dismissed,
    staleTime: 60000,
  });

  const dismiss = () => {
    sessionStorage.setItem('onboarding-dismissed', '1');
    setDismissed(true);
  };

  if (dismissed) return null;

  const completed = [
    stats?.connections > 0,
    stats?.listings > 0,
    stats?.forumPosts > 0,
  ].filter(Boolean).length;

  const total = 4;
  const profileDone = false; // always show until explicitly dismissed
  const pct = Math.round(((completed + (profileDone ? 1 : 0)) / total) * 100);
  if (pct >= 100) return null;

  return (
    <div className="bg-card border border-primary/20 rounded-xl p-4 mb-4 relative">
      <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition">
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">👋</span>
        <div>
          <p className="text-sm font-bold text-foreground">Bienvenue sur The Communium !</p>
          <p className="text-xs text-muted-foreground">Complétez votre profil pour profiter pleinement de la plateforme</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progression</span><span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 gap-2">
        {STEPS.map(({ icon: Icon, label, href }, i) => {
          const done = i === 0 ? false : (i === 1 ? stats?.connections > 0 : i === 2 ? stats?.listings > 0 : stats?.forumPosts > 0);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition ${
                done
                  ? 'bg-green-500/10 text-green-600 line-through opacity-60'
                  : 'bg-accent text-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
