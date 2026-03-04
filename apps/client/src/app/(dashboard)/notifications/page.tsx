"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useT } from '@/lib/i18n';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${apiUrl}/notifications/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, apiUrl]);

  const markAsRead = async (id: string) => {
    await fetch(`${apiUrl}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user?.id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch(`${apiUrl}/notifications/${user?.id}/read-all`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.header.notificationsTooltip}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} non lue(s)</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-gray-500">Aucune notification</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => !notif.isRead && markAsRead(notif.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                notif.isRead
                  ? "bg-white border-gray-100"
                  : "bg-blue-50 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{TYPE_ICONS[notif.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${notif.isRead ? "text-gray-700" : "text-gray-900"}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
