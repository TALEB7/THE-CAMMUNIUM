"use client";

import { useState, useEffect } from "react";
import { useUser, UserProfile } from "@clerk/nextjs";
import { useT } from '@/lib/i18n';

export default function SettingsPage() {
  const { user } = useUser();
  const { t } = useT();
  const [tab, setTab] = useState<"account" | "notifications">("account");
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${apiUrl}/notifications/${user.id}/preferences`)
      .then((r) => r.json())
      .then(setPrefs)
      .catch(() => {});
  }, [user?.id, apiUrl]);

  const savePrefs = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await fetch(`${apiUrl}/notifications/${user.id}/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
    } catch {}
    setSaving(false);
  };

  const togglePref = (key: string) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const prefGroups = [
    {
      title: t.settings.messagesGroup,
      items: [
        { key: "emailMessages", label: t.settings.byEmail },
        { key: "pushMessages", label: t.settings.push },
        { key: "inAppMessages", label: t.settings.inApp },
      ],
    },
    {
      title: t.settings.auctionsGroup,
      items: [
        { key: "emailBids", label: t.settings.byEmail },
        { key: "pushBids", label: t.settings.push },
        { key: "inAppBids", label: t.settings.inApp },
      ],
    },
    {
      title: t.settings.mentorshipGroup,
      items: [
        { key: "emailMentorship", label: t.settings.byEmail },
        { key: "pushMentorship", label: t.settings.push },
        { key: "inAppMentorship", label: t.settings.inApp },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.settings.title}</h1>

      <div className="flex gap-2 mb-6">
        {(["account", "notifications"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              tab === tabKey ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            {tabKey === "account" ? t.settings.accountTab : t.settings.notificationsTab}
          </button>
        ))}
      </div>

      {tab === "account" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0",
              },
            }}
          />
        </div>
      )}

      {tab === "notifications" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {prefGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <button
                      onClick={() => togglePref(item.key)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        prefs[item.key] ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          prefs[item.key] ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={savePrefs}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300"
          >
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      )}
    </div>
  );
}
