'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Loader2,
  ShoppingBag,
  Gavel,
  Calendar,
  Users,
  GraduationCap,
  Trophy,
  MessageCircle,
  Link2,
  Globe,
  User,
} from 'lucide-react';

type FeedType = 'global' | 'personal';

export default function FeedPage() {
  const { t } = useT();
  const { userId } = useAuth();
  const [feedType, setFeedType] = useState<FeedType>('global');

  const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
    POST: { icon: MessageCircle, label: t.feed.post, color: '#1a237e' },
    LISTING: { icon: ShoppingBag, label: t.feed.listing, color: '#2e7d32' },
    AUCTION: { icon: Gavel, label: t.feed.auctionType, color: '#e65100' },
    EVENT: { icon: Calendar, label: t.feed.event, color: '#6a1b9a' },
    CONNECTION: { icon: Link2, label: t.feed.connection, color: '#0277bd' },
    GROUP_JOIN: { icon: Users, label: t.feed.group, color: '#00695c' },
    MENTORSHIP: { icon: GraduationCap, label: t.feed.mentorshipType, color: '#4527a0' },
    ACHIEVEMENT: { icon: Trophy, label: t.feed.achievement, color: '#c9a730' },
  };

  // Global feed
  const { data: globalFeed, isLoading: globalLoading } = useQuery({
    queryKey: ['feed-global'],
    queryFn: () => api.get('/activity-feed/global').then((r) => r.data),
    enabled: feedType === 'global',
  });

  // Personal feed
  const { data: personalFeed, isLoading: personalLoading } = useQuery({
    queryKey: ['feed-personal', userId],
    queryFn: () => api.get(`/activity-feed/personal/${userId}`).then((r) => r.data),
    enabled: feedType === 'personal' && !!userId,
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['feed-stats', userId],
    queryFn: () => api.get(`/activity-feed/stats/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const feed = feedType === 'global' ? globalFeed : personalFeed;
  const isLoading = feedType === 'global' ? globalLoading : personalLoading;

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return t.common.timeJustNow;
    if (min < 60) return t.common.timeMinAgo.replace('{n}', String(min));
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return t.common.timeHoursAgo.replace('{n}', String(hrs));
    const days = Math.floor(hrs / 24);
    return t.common.timeDaysAgo.replace('{n}', String(days));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a237e] font-heading">{`📰 ${t.feed.title}`}</h1>
          <p className="text-sm text-gray-500">{t.feed.description}</p>
        </div>
        {stats && (
          <Badge variant="outline" className="border-[#d4c088] text-[#1a237e] text-xs">
            {stats.totalActivities} {t.feed.activities}
          </Badge>
        )}
      </div>

      {/* Toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setFeedType('global')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition ${
            feedType === 'global' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          {t.feed.global}
        </button>
        <button
          onClick={() => setFeedType('personal')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition ${
            feedType === 'personal' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          {t.feed.myNetwork}
        </button>
      </div>

      {/* Feed items */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
      ) : !feed?.items?.length ? (
        <Card className="border-[#d4c088]/40">
          <CardContent className="p-12 text-center">
            <Activity className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">{t.feed.noActivity}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {feedType === 'personal'
                ? t.feed.noActivityPersonal
                : t.feed.noActivityGlobal}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feed.items.map((item: any) => {
            const config = typeConfig[item.type] || typeConfig.POST;
            const Icon = config.icon;
            return (
              <Card key={item.id} className="border-[#d4c088]/40 hover:border-[#c9a730]/50 transition">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Activity type icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: config.color + '15' }}
                    >
                      <Icon className="h-5 w-5" style={{ color: config.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.user?.avatarUrl || '/default-avatar.png'}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <p className="text-sm">
                            <span className="font-semibold text-[#1a237e]">
                              {item.user?.firstName} {item.user?.lastName}
                            </span>
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                            style={{ borderColor: config.color + '40', color: config.color }}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{formatTime(item.createdAt)}</span>
                      </div>

                      {item.title && (
                        <p className="text-sm font-medium text-gray-800 mt-1">{item.title}</p>
                      )}
                      {item.content && (
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-3">{item.content}</p>
                      )}

                      {/* Metadata */}
                      {item.metadata && (
                        <div className="flex gap-2 mt-2">
                          {item.metadata.price && (
                            <Badge variant="secondary" className="text-xs">{item.metadata.price} MAD</Badge>
                          )}
                          {item.metadata.city && (
                            <Badge variant="outline" className="text-xs">{item.metadata.city}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Activity stats */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <Card className="border-[#d4c088]/40">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.feed.activitiesByType}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]: [string, any]) => {
                const config = typeConfig[type] || typeConfig.POST;
                const Icon = config.icon;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: config.color + '10', color: config.color }}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}: {count}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
