'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bookmark, BookmarkCheck, ArrowLeft, ShoppingBag, MessageSquare,
  Calendar, Users, BarChart3, StickyNote, Trash2, Edit3, X, Check,
} from 'lucide-react';

export default function BookmarksPage() {
  const { userId } = useAuth();
  const { t } = useT();

  const TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
    LISTING: { icon: ShoppingBag, label: t.bookmarks.listings, color: '#C8102E' },
    FORUM_POST: { icon: MessageSquare, label: t.bookmarks.forum, color: '#1a237e' },
    EVENT: { icon: Calendar, label: t.bookmarks.events, color: '#2e7d32' },
    GROUP: { icon: Users, label: t.bookmarks.groups, color: '#6a1b9a' },
    POLL: { icon: BarChart3, label: t.bookmarks.polls, color: '#e65100' },
  };
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // ── Queries ──
  const { data: bookmarksData } = useQuery({
    queryKey: ['bookmarks', userId, typeFilter],
    queryFn: () =>
      api
        .get(`/bookmarks/${userId}`, { params: { type: typeFilter, limit: 50 } })
        .then(r => r.data),
    enabled: !!userId,
  });

  const { data: stats } = useQuery({
    queryKey: ['bookmarks-stats', userId],
    queryFn: () => api.get(`/bookmarks/${userId}/stats`).then(r => r.data),
    enabled: !!userId,
  });

  // ── Mutations ──
  const toggleBookmark = useMutation({
    mutationFn: (data: { targetType: string; targetId: string }) =>
      api.post('/bookmarks/toggle', { userId, ...data }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks-stats'] });
    },
  });

  const updateNote = useMutation({
    mutationFn: (data: { id: string; note: string }) =>
      api.patch(`/bookmarks/${data.id}/note`, { userId, note: data.note }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      setEditingNote(null);
    },
  });

  const bookmarks = bookmarksData?.data || bookmarksData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookmarkCheck className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-primary">{t.bookmarks.title}</h1>
          <p className="text-sm text-muted-foreground">{t.bookmarks.description}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const count = (stats as any[]).find((s: any) => s.targetType === type)?._count || 0;
            const Icon = meta.icon;
            return (
              <Card
                key={type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  typeFilter === type ? 'border-primary bg-accent' : ''
                }`}
                onClick={() => setTypeFilter(typeFilter === type ? undefined : type)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  <div>
                    <p className="text-lg font-bold text-primary">{count}</p>
                    <p className="text-xs text-muted-foreground">{meta.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTypeFilter(undefined)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !typeFilter
              ? 'bg-primary text-white'
              : 'bg-card text-primary border border-border hover:bg-accent'
          }`}
        >
          {t.bookmarks.all}
        </button>
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? undefined : type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              typeFilter === type
                ? 'text-white'
                : 'bg-card border border-border hover:bg-accent'
            }`}
            style={typeFilter === type ? { background: meta.color } : { color: meta.color }}
          >
            {meta.label}
          </button>
        ))}
      </div>

      {/* Bookmarks list */}
      <div className="space-y-3">
        {(bookmarks as any[]).map((bm: any) => {
          const meta = TYPE_META[bm.targetType] || TYPE_META.LISTING;
          const Icon = meta.icon;
          return (
            <Card key={bm.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${meta.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="text-xs" style={{ background: `${meta.color}20`, color: meta.color }}>
                        {meta.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(bm.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-primary truncate">
                      {bm.target?.title || bm.target?.name || bm.target?.question || `ID: ${bm.targetId}`}
                    </h3>
                    {bm.target?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{bm.target.description}</p>
                    )}

                    {/* Note */}
                    {editingNote === bm.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm rounded border border-border focus:ring-1 focus:ring-[#C8102E]"
                          placeholder={t.bookmarks.addNote}
                          autoFocus
                        />
                        <button
                          onClick={() => updateNote.mutate({ id: bm.id, note: noteText })}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingNote(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : bm.note ? (
                      <p
                        className="text-xs text-muted-foreground mt-1 italic cursor-pointer hover:text-primary"
                        onClick={() => { setEditingNote(bm.id); setNoteText(bm.note || ''); }}
                      >
                        <StickyNote className="w-3 h-3 inline mr-1" />{bm.note}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingNote(bm.id); setNoteText(bm.note || ''); }}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded"
                      title={t.bookmarks.noteTooltip}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleBookmark.mutate({ targetType: bm.targetType, targetId: bm.targetId })}
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-destructive/10 rounded"
                      title={t.bookmarks.deleteTooltip}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(bookmarks as any[]).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bookmark className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg">{t.bookmarks.noBookmarks}</p>
            <p className="text-sm mt-1">{t.bookmarks.noBookmarksDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
}
