'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone, ArrowLeft, Bell, Pin, ExternalLink, Eye, CheckCircle,
  AlertTriangle, Info, Wrench, Gift, Zap,
} from 'lucide-react';

type ViewMode = 'browse' | 'detail';

export default function AnnouncementsPage() {
  const { userId } = useAuth();
  const { t } = useT();

  const TYPE_META: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
    INFO: { icon: Info, color: '#1a237e', bgColor: '#e8eaf6', label: t.announcements.information },
    UPDATE: { icon: Zap, color: '#2e7d32', bgColor: '#e8f5e9', label: t.announcements.update },
    MAINTENANCE: { icon: Wrench, color: '#e65100', bgColor: '#fff3e0', label: t.announcements.maintenance },
    PROMOTION: { icon: Gift, color: '#6a1b9a', bgColor: '#f3e5f5', label: t.announcements.promotion },
    URGENT: { icon: AlertTriangle, color: '#c62828', bgColor: '#ffebee', label: t.announcements.urgent },
  };
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('browse');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Queries ──
  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements?limit=50').then(r => r.data),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['announcements-unread', userId],
    queryFn: () => api.get(`/announcements/unread/${userId}`).then(r => r.data),
    enabled: !!userId,
  });

  const { data: detail } = useQuery({
    queryKey: ['announcement', selectedId],
    queryFn: () => api.get(`/announcements/${selectedId}`).then(r => r.data),
    enabled: view === 'detail' && !!selectedId,
  });

  // ── Mark read ──
  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/announcements/${id}/read`, { userId }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-unread'] });
    },
  });

  const announcements = announcementsData?.announcements || [];

  // ── Detail view ──
  if (view === 'detail' && detail) {
    const meta = TYPE_META[detail.type] || TYPE_META.INFO;
    const Icon = meta.icon;
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('browse')} className="p-2 hover:bg-[#1a237e]/10 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-[#1a237e]" />
          </button>
          <h1 className="text-2xl font-bold text-[#1a237e]">{t.announcements.title}</h1>
        </div>

        <Card className="border-t-4" style={{ borderTopColor: meta.color }}>
          <CardContent className="p-8 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: meta.bgColor }}>
                <Icon className="w-6 h-6" style={{ color: meta.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge style={{ background: meta.bgColor, color: meta.color }}>{meta.label}</Badge>
                  {detail.isPinned && (
                    <Badge variant="outline" className="text-[#c9a730] border-[#c9a730]">
                      <Pin className="w-3 h-3 mr-1" /> {t.announcements.pinned}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {detail.viewCount} {t.common.views}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-[#1a237e]">{detail.title}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {detail.publishedAt
                    ? new Date(detail.publishedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })
                    : t.common.draft}
                </p>
              </div>
            </div>

            {detail.imageUrl && (
              <img src={detail.imageUrl} alt="" className="w-full rounded-lg max-h-80 object-cover" />
            )}

            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {detail.content}
            </div>

            {detail.linkUrl && (
              <a
                href={detail.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a237e] text-white rounded-lg hover:bg-[#1a237e]/90"
              >
                <ExternalLink className="w-4 h-4" /> {t.announcements.learnMore}
              </a>
            )}

            {detail.expiresAt && (
              <p className="text-sm text-gray-400">
                {t.announcements.expiresOn} {new Date(detail.expiresAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Browse view ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-[#c9a730]" />
          <div>
            <h1 className="text-2xl font-bold text-[#1a237e]">{t.announcements.title}</h1>
            <p className="text-sm text-gray-500">{t.announcements.description}</p>
          </div>
        </div>
        {(unreadCount?.count || 0) > 0 && (
          <Badge className="bg-red-500 text-white px-3 py-1">
            {unreadCount.count} {t.announcements.unread}
          </Badge>
        )}
      </div>

      {/* Announcements list */}
      <div className="space-y-4">
        {(announcements as any[]).map((ann: any) => {
          const meta = TYPE_META[ann.type] || TYPE_META.INFO;
          const Icon = meta.icon;
          return (
            <Card
              key={ann.id}
              className={`cursor-pointer hover:shadow-lg transition-all ${
                ann.isPinned ? 'border-l-4 border-l-[#c9a730] bg-[#faf6e9]/50' : ''
              }`}
              onClick={() => {
                setSelectedId(ann.id);
                setView('detail');
                if (userId) markRead.mutate(ann.id);
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.bgColor }}
                  >
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="text-xs" style={{ background: meta.bgColor, color: meta.color }}>
                        {meta.label}
                      </Badge>
                      {ann.isPinned && <Pin className="w-3.5 h-3.5 text-[#c9a730]" />}
                      <span className="text-xs text-gray-400 ml-auto">
                        {ann.publishedAt && new Date(ann.publishedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#1a237e] text-lg">{ann.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{ann.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {ann.viewCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(announcements as any[]).length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg">{t.announcements.noAnnouncements}</p>
          </div>
        )}
      </div>
    </div>
  );
}
