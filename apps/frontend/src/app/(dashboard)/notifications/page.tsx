"use client";

import { useUser } from "@/lib/auth-client";
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  MESSAGE: "💬", BID: "💰", AUCTION_WON: "🏆", AUCTION_ENDED: "⏰",
  LISTING_SOLD: "💸", MENTORSHIP_REQUEST: "🎓", MENTORSHIP_SESSION: "📚",
  PAYMENT: "💳", SYSTEM: "⚙️", ADMIN: "🛡️",
};

export default function NotificationsPage() {
  const { user } = useUser();
  const { t } = useT();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.get(`/notifications/${user!.id}`).then((r) => r.data),
    enabled: !!user?.id,
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount: number = data?.unreadCount || 0;

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, { userId: user?.id }),
    onSuccess: (_data, id) => {
      queryClient.setQueryData(['notifications', user?.id], (old: any) => ({
        ...old,
        unreadCount: Math.max(0, (old?.unreadCount || 0) - 1),
        notifications: old?.notifications?.map((n: Notification) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
      queryClient.invalidateQueries({ queryKey: ['notification-badge', user?.id] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch(`/notifications/${user?.id}/read-all`),
    onSuccess: () => {
      queryClient.setQueryData(['notifications', user?.id], (old: any) => ({
        ...old,
        unreadCount: 0,
        notifications: old?.notifications?.map((n: Notification) => ({ ...n, isRead: true })),
      }));
      queryClient.invalidateQueries({ queryKey: ['notification-badge', user?.id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-heading">🔔 {t.header.notificationsTooltip}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} non lue(s)</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-sm text-primary hover:text-primary/80 font-semibold disabled:opacity-50 transition"
          >
            {markAllRead.isPending ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Tout marquer comme lu'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Aucune notification</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => !notif.isRead && markRead.mutate(notif.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                notif.isRead
                  ? "bg-card border-border"
                  : "bg-primary/5 border-primary/30 hover:bg-primary/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{TYPE_ICONS[notif.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold truncate ${notif.isRead ? "text-foreground/80" : "text-foreground"}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
