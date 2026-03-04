'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useT } from '@/lib/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Award, Trophy, Star, ArrowLeft, Shield, Crown, Medal, Users,
  Zap, Target, Sparkles, Lock,
} from 'lucide-react';

type ViewMode = 'browse' | 'detail' | 'leaderboard';

const CATEGORY_ICONS: Record<string, any> = {
  community: Users,
  commerce: Target,
  achievement: Trophy,
  milestone: Star,
  special: Crown,
};

const CATEGORY_COLORS: Record<string, string> = {
  community: '#3949ab',
  commerce: '#c9a730',
  achievement: '#e65100',
  milestone: '#2e7d32',
  special: '#6a1b9a',
};

export default function BadgesPage() {
  const { t } = useT();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('browse');
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  // ── Queries ──
  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/badges').then(r => r.data),
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['user-badges', userId],
    queryFn: () => api.get(`/badges/user/${userId}`).then(r => r.data),
    enabled: !!userId,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/badges/leaderboard?limit=30').then(r => r.data),
    enabled: view === 'leaderboard',
  });

  const { data: badgeDetail } = useQuery({
    queryKey: ['badge', selectedBadge],
    queryFn: () => api.get(`/badges/${selectedBadge}`).then(r => r.data),
    enabled: view === 'detail' && !!selectedBadge,
  });

  const checkBadges = useMutation({
    mutationFn: () => api.post(`/badges/check/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });

  const earnedIds = new Set(userBadges.map((ub: any) => ub.badgeId));

  // group badges by category
  const grouped = (badges as any[]).reduce((acc: any, b: any) => {
    const cat = b.category || 'achievement';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {} as Record<string, any[]>);

  // ── Views ──
  if (view === 'leaderboard') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('browse')} className="p-2 hover:bg-[#1a237e]/10 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-[#1a237e]" />
          </button>
          <Trophy className="w-7 h-7 text-[#c9a730]" />
          <h1 className="text-2xl font-bold text-[#1a237e]">{t.badges.leaderboard}</h1>
        </div>

        <div className="space-y-3">
          {(leaderboard as any[]).map((entry: any, idx: number) => (
            <Card key={entry.userId} className={`border-l-4 ${idx < 3 ? 'border-l-[#c9a730] bg-[#faf6e9]' : 'border-l-[#1a237e]/20'}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  idx === 0 ? 'bg-[#c9a730] text-white' :
                  idx === 1 ? 'bg-gray-400 text-white' :
                  idx === 2 ? 'bg-amber-600 text-white' :
                  'bg-[#1a237e]/10 text-[#1a237e]'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1a237e]">
                    {entry.profile?.firstName} {entry.profile?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{entry._count?.badges || 0} {t.badges.badgesCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#c9a730]">{entry.xp || 0}</p>
                  <p className="text-xs text-gray-400">{t.badges.xp}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {(leaderboard as any[]).length === 0 && (
            <p className="text-center text-gray-500 py-12">{t.badges.noLeaderboard}</p>
          )}
        </div>
      </div>
    );
  }

  if (view === 'detail' && badgeDetail) {
    const Icon = CATEGORY_ICONS[badgeDetail.category] || Award;
    const color = CATEGORY_COLORS[badgeDetail.category] || '#c9a730';
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('browse')} className="p-2 hover:bg-[#1a237e]/10 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-[#1a237e]" />
          </button>
          <h1 className="text-2xl font-bold text-[#1a237e]">{t.badges.badgeDetail}</h1>
        </div>

        <Card className="border-t-4" style={{ borderTopColor: color }}>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{ background: `${color}20` }}>
              <Icon className="w-12 h-12" style={{ color }} />
            </div>
            <h2 className="text-2xl font-bold text-[#1a237e]">{badgeDetail.name}</h2>
            <p className="text-gray-600">{badgeDetail.description}</p>
            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="text-sm" style={{ borderColor: color, color }}>
                {badgeDetail.category}
              </Badge>
              <Badge className="bg-[#c9a730]/20 text-[#c9a730]">
                +{badgeDetail.xpReward} XP
              </Badge>
            </div>
            {earnedIds.has(badgeDetail.id) ? (
              <div className="inline-flex items-center gap-2 text-green-600 font-semibold mt-4">
                <Sparkles className="w-5 h-5" /> {t.badges.obtained}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-gray-400 mt-4">
                <Lock className="w-5 h-5" /> {t.badges.notObtained}
              </div>
            )}
            {badgeDetail.users?.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-[#1a237e] mb-3">
                  {t.badges.membersWithBadge} ({badgeDetail.users.length})
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {badgeDetail.users.slice(0, 20).map((ub: any) => (
                    <Badge key={ub.id} variant="outline" className="text-xs">
                      {ub.user?.profile?.firstName || t.badges.user}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Browse ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="w-7 h-7 text-[#c9a730]" />
          <div>
            <h1 className="text-2xl font-bold text-[#1a237e]">{t.badges.title}</h1>
            <p className="text-sm text-gray-500">{t.badges.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => checkBadges.mutate()}
            disabled={checkBadges.isPending}
            className="px-4 py-2 text-sm font-medium bg-[#1a237e] text-white rounded-lg hover:bg-[#1a237e]/90 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 inline mr-1" />
            {checkBadges.isPending ? t.badges.checking : t.badges.checkBadges}
          </button>
          <button
            onClick={() => setView('leaderboard')}
            className="px-4 py-2 text-sm font-medium bg-[#c9a730] text-white rounded-lg hover:bg-[#c9a730]/90"
          >
            <Trophy className="w-4 h-4 inline mr-1" /> {t.badges.leaderboard}
          </button>
        </div>
      </div>

      {/* My badges summary */}
      <Card className="border-[#c9a730]/30 bg-gradient-to-r from-[#faf6e9] to-white">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#c9a730]/20 flex items-center justify-center">
            <Medal className="w-8 h-8 text-[#c9a730]" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[#1a237e]">{userBadges.length}</p>
            <p className="text-sm text-gray-500">{t.badges.earnedBadges}</p>
          </div>
          <div className="ml-auto flex -space-x-2">
            {userBadges.slice(0, 5).map((ub: any) => {
              const Icon2 = CATEGORY_ICONS[ub.badge?.category] || Star;
              return (
                <div key={ub.id} className="w-10 h-10 rounded-full bg-white border-2 border-[#c9a730] flex items-center justify-center">
                  <Icon2 className="w-5 h-5 text-[#c9a730]" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All badges by category */}
      {Object.entries(grouped).map(([cat, items]) => {
        const CatIcon = CATEGORY_ICONS[cat] || Shield;
        const catColor = CATEGORY_COLORS[cat] || '#c9a730';
        return (
          <div key={cat} className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold capitalize" style={{ color: catColor }}>
              <CatIcon className="w-5 h-5" /> {cat}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(items as any[]).map((badge: any) => {
                const earned = earnedIds.has(badge.id);
                return (
                  <Card
                    key={badge.id}
                    className={`cursor-pointer hover:shadow-lg transition-all ${earned ? 'border-[#c9a730] bg-[#faf6e9]' : 'opacity-60 grayscale'}`}
                    onClick={() => { setSelectedBadge(badge.id); setView('detail'); }}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ background: earned ? `${catColor}20` : '#f3f4f6' }}>
                        {badge.isSecret && !earned ? (
                          <Lock className="w-7 h-7 text-gray-400" />
                        ) : (
                          <Award className="w-7 h-7" style={{ color: earned ? catColor : '#9ca3af' }} />
                        )}
                      </div>
                      <p className="font-semibold text-sm text-[#1a237e]">
                        {badge.isSecret && !earned ? t.badges.secret : badge.name}
                      </p>
                      <Badge className="text-xs" style={{ background: `${catColor}20`, color: catColor }}>
                        +{badge.xpReward} XP
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {badges.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t.badges.noBadges}</p>
        </div>
      )}
    </div>
  );
}
