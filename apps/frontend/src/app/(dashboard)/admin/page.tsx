"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/auth-client";
import { useT } from "@/lib/i18n";
import { api } from "@/lib/api";

interface Stats {
  users: { total: number; new7d: number; new30d: number };
  listings: { total: number; active: number };
  auctions: { total: number; active: number };
  payments: { total: number; revenue30d: number };
  messages: { total: number };
  mentorship: { totalMentors: number; activeSessions: number };
  reports: { pending: number };
}

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  membership: { plan: string } | null;
  tksWallet: { balance: number } | null;
  _count: { listings: number; payments: number };
}

type Tab = "overview" | "users" | "reports" | "testimonials" | "newsletter" | "contact" | "ai-risk" | "kyb";

interface KybRequest {
  id: string;
  userId: string;
  status: string;
  submittedAt: string;
  representativeName: string | null;
  rcUrl: string | null;
  statutsUrl: string | null;
  representativeIdUrl: string | null;
  taxCertUrl: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    businessProfile: {
      companyName: string | null;
      rc: string | null;
      ice: string | null;
      ifNumber: string | null;
      role: string | null;
      personInCharge: string | null;
      city: string | null;
      country: string | null;
    } | null;
  };
}

export default function AdminDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Phase 7 state
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [newsStats, setNewsStats] = useState<any>(null);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [contactStats, setContactStats] = useState<any>(null);

  // AI Risk state
  const [churnData, setChurnData] = useState<any>(null);
  const [churnLoading, setChurnLoading] = useState(false);
  const [churnRiskFilter, setChurnRiskFilter] = useState<string>('');

  // KYB (business verification) state
  const [kybRequests, setKybRequests] = useState<KybRequest[]>([]);
  const [kybLoading, setKybLoading] = useState(false);
  const [kybActionId, setKybActionId] = useState<string | null>(null);

  const { t } = useT();

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      api.get('/admin/dashboard').then((r) => r.data).catch(() => null),
      api.get('/admin/users').then((r) => r.data).catch(() => null),
      api.get('/testimonials/admin/all').then((r) => r.data).catch(() => null),
      api.get('/newsletter/subscribers/stats').then((r) => r.data).catch(() => null),
      api.get('/newsletter/contact').then((r) => r.data).catch(() => null),
      api.get('/newsletter/contact/stats').then((r) => r.data).catch(() => null),
    ])
      .then(([s, u, tData, ns, cm, cs]) => {
        if (s) setStats(s);
        if (u) setUsers(u.users || []);
        if (tData) setTestimonials(tData.data || []);
        if (ns) setNewsStats(ns);
        if (cm) setContactMessages(cm.data || []);
        if (cs) setContactStats(cs);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleTestimonialAction = async (id: string, action: "approve" | "reject" | "feature") => {
    try {
      await api.patch(`/testimonials/${id}/${action}`);
      const { data } = await api.get('/testimonials/admin/all');
      setTestimonials(data.data || []);
    } catch {}
  };

  const handleContactAction = async (id: string, status: string) => {
    try {
      await api.patch(`/newsletter/contact/${id}`, { status });
      const { data } = await api.get('/newsletter/contact');
      setContactMessages(data.data || []);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const StatCard = ({ label, value, sub, icon }: { label: string; value: number | string; sub?: string; icon: string }) => (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-primary">{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-green-600 mt-1">{sub}</p>}
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: t.admin.tabOverview },
    { key: "users", label: t.admin.tabUsers },
    { key: "kyb", label: "Vérification KYB" },
    { key: "testimonials", label: t.admin.tabTestimonials },
    { key: "newsletter", label: t.admin.tabNewsletter },
    { key: "contact", label: t.admin.tabContact },
    { key: "reports", label: t.admin.tabReports },
    { key: "ai-risk", label: "IA Risque" },
  ];

  const loadKyb = async () => {
    setKybLoading(true);
    try {
      const { data } = await api.get('/kyc/admin/business/pending');
      setKybRequests(data.items || []);
    } catch {}
    finally { setKybLoading(false); }
  };

  const handleKybReview = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !window.confirm('Confirmer le rejet de ce dossier KYB ?')) return;
    setKybActionId(id);
    try {
      await api.patch(`/kyc/admin/business/${id}/review`, { status });
      setKybRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {}
    finally { setKybActionId(null); }
  };

  const docUrl = (relativePath: string | null) => {
    if (!relativePath) return null;
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
    return `${base}/${relativePath}`;
  };

  const loadChurnData = async (riskFilter = '') => {
    setChurnLoading(true);
    try {
      const { data } = await api.get('/analytics/churn-risk', {
        params: riskFilter ? { risk: riskFilter } : {},
      });
      setChurnData(data);
    } catch {}
    finally { setChurnLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-primary font-heading">{t.admin.title}</h1>
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => {
                setTab(tabItem.key);
                if (tabItem.key === 'ai-risk' && !churnData) loadChurnData();
                if (tabItem.key === 'kyb') loadKyb();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === tabItem.key
                  ? "bg-primary text-white"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border"
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && stats && stats.users && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="👥" label={t.admin.users} value={stats.users?.total ?? 0} sub={`+${stats.users?.new7d ?? 0} ${t.admin.thisWeek}`} />
          <StatCard icon="📝" label={t.admin.activeListings} value={stats.listings?.active ?? 0} />
          <StatCard icon="🔨" label={t.admin.activeAuctions} value={stats.auctions?.active ?? 0} />
          <StatCard icon="💰" label={t.admin.revenue30d} value={`${(stats.payments?.revenue30d ?? 0).toLocaleString("fr-FR")} MAD`} />
          <StatCard icon="💬" label={t.admin.messagesTotal} value={stats.messages?.total ?? 0} />
          <StatCard icon="🎓" label={t.admin.mentors} value={stats.mentorship?.totalMentors ?? 0} />
          <StatCard icon="📚" label={t.admin.activeSessions} value={stats.mentorship?.activeSessions ?? 0} />
          <StatCard icon="⚠️" label={t.admin.reports} value={stats.reports.pending} sub={t.admin.pendingReports} />
          {newsStats && <StatCard icon="📮" label={t.admin.newsletterSubs} value={newsStats.active ?? 0} />}
          {contactStats && <StatCard icon="✉️" label={t.admin.contactMessages} value={contactStats.new ?? 0} sub={t.admin.newMessages} />}
        </div>
      )}

      {/* ── Users ── */}
      {tab === "users" && (
        <div>
          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.admin.searchUser}
              className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/50 w-full max-w-md"
            />
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-accent border-b border-[#C8102E]/20">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.name}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.email}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.role}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.plan}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.tks}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.tableHeaders.status}</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((u) => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                  })
                  .map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-accent">
                      <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-muted text-foreground/80"
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.membership?.plan || "-"}</td>
                      <td className="px-4 py-3 font-medium text-amber-700">{u.tksWallet?.balance || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>{u.status}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Testimonials Moderation ── */}
      {tab === "testimonials" && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{t.admin.moderateTestimonials}</p>
          {!testimonials.length ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border">
              <p className="text-4xl mb-4">💬</p>
              <p className="text-muted-foreground">{t.admin.noTestimonials}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testimonials.map((item: any) => (
                <div key={item.id} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-primary">
                          {item.author?.firstName} {item.author?.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.role && `${item.role}`}{item.company && ` · ${item.company}`}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-xs ${i < item.rating ? 'text-primary' : 'text-muted-foreground/50'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80">{item.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {item.isApproved ? t.common.approved : t.common.pending}
                      </span>
                      {item.isFeatured && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-accent text-primary">★ Featured</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {!item.isApproved && (
                      <button onClick={() => handleTestimonialAction(item.id, "approve")}
                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                        {t.admin.approve}
                      </button>
                    )}
                    {item.isApproved && (
                      <button onClick={() => handleTestimonialAction(item.id, "reject")}
                        className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-red-600 rounded-lg hover:bg-red-100 transition">
                        {t.admin.reject}
                      </button>
                    )}
                    <button onClick={() => handleTestimonialAction(item.id, "feature")}
                      className="px-3 py-1.5 text-xs font-medium bg-accent text-primary rounded-lg hover:bg-accent transition">
                      {item.isFeatured ? t.admin.unfeatureBtn : t.admin.featureBtn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Newsletter ── */}
      {tab === "newsletter" && (
        <div className="space-y-4">
          {newsStats && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon="📮" label={t.admin.activeSubs} value={newsStats.active ?? 0} />
              <StatCard icon="📭" label={t.admin.unsubscribed} value={newsStats.unsubscribed ?? 0} />
              <StatCard icon="📊" label={t.admin.totalHistory} value={newsStats.total ?? 0} />
            </div>
          )}
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <p className="text-4xl mb-3">📰</p>
            <p className="text-muted-foreground">{t.admin.campaignManagement}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.admin.campaignManagementDesc}</p>
          </div>
        </div>
      )}

      {/* ── Contact Messages ── */}
      {tab === "contact" && (
        <div>
          {contactStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard icon="🆕" label={t.admin.newContact} value={contactStats.new ?? 0} />
              <StatCard icon="👁️" label={t.admin.readContact} value={contactStats.read ?? 0} />
              <StatCard icon="✅" label={t.admin.repliedContact} value={contactStats.replied ?? 0} />
              <StatCard icon="📦" label={t.admin.archivedContact} value={contactStats.archived ?? 0} />
            </div>
          )}
          {!contactMessages.length ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border">
              <p className="text-4xl mb-4">✉️</p>
              <p className="text-muted-foreground">{t.admin.noContactMessages}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contactMessages.map((m: any) => (
                <div key={m.id} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-primary">{m.name}</span>
                        <span className="text-xs text-muted-foreground">{m.email}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">{m.subject}</p>
                      <p className="text-sm text-muted-foreground">{m.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                      m.status === "NEW" ? "bg-blue-100 text-blue-700" :
                      m.status === "READ" ? "bg-yellow-100 text-yellow-700" :
                      m.status === "REPLIED" ? "bg-green-100 text-green-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{m.status}</span>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {m.status === "NEW" && (
                      <button onClick={() => handleContactAction(m.id, "READ")}
                        className="px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition">
                        {t.admin.markRead}
                      </button>
                    )}
                    {(m.status === "NEW" || m.status === "READ") && (
                      <button onClick={() => handleContactAction(m.id, "REPLIED")}
                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                        {t.admin.markReplied}
                      </button>
                    )}
                    {m.status !== "ARCHIVED" && (
                      <button onClick={() => handleContactAction(m.id, "ARCHIVED")}
                        className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted transition">
                        {t.admin.archive}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── KYB (Business verification) ── */}
      {tab === "kyb" && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Dossiers de vérification d'entreprise (KYB) en attente de validation.
          </p>
          {kybLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !kybRequests.length ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border">
              <p className="text-4xl mb-4">🏢</p>
              <p className="text-muted-foreground">Aucun dossier KYB en attente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kybRequests.map((req) => {
                const bp = req.user.businessProfile;
                const docs: { label: string; url: string | null }[] = [
                  { label: "Registre de Commerce", url: docUrl(req.rcUrl) },
                  { label: "Statuts", url: docUrl(req.statutsUrl) },
                  { label: "CIN représentant", url: docUrl(req.representativeIdUrl) },
                  { label: "Taxe Professionnelle / ICE", url: docUrl(req.taxCertUrl) },
                ];
                return (
                  <div key={req.id} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <p className="text-sm font-semibold text-primary">{bp?.companyName || "—"}</p>
                        <p className="text-xs text-muted-foreground">{req.user.email}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-xs text-muted-foreground">
                          <span>RC: {bp?.rc || "—"}</span>
                          <span>ICE: {bp?.ice || "—"}</span>
                          <span>Personne en charge: {req.representativeName || bp?.personInCharge || "—"}</span>
                          <span>Fonction: {bp?.role || "—"}</span>
                          <span>Ville: {[bp?.city, bp?.country].filter(Boolean).join(", ") || "—"}</span>
                          <span>Soumis le: {new Date(req.submittedAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 shrink-0">
                        En attente
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                      {docs.map((d) => (
                        d.url ? (
                          <a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium bg-accent text-primary rounded-lg hover:bg-accent/70 transition">
                            📄 {d.label}
                          </a>
                        ) : (
                          <span key={d.label} className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-lg">
                            ⛔ {d.label} manquant
                          </span>
                        )
                      ))}
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <button
                        onClick={() => handleKybReview(req.id, "approved")}
                        disabled={kybActionId === req.id}
                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                      >
                        {t.admin.approve}
                      </button>
                      <button
                        onClick={() => handleKybReview(req.id, "rejected")}
                        disabled={kybActionId === req.id}
                        className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                      >
                        {t.admin.reject}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Reports ── */}
      {tab === "reports" && (
        <div className="bg-card rounded-xl p-12 text-center border border-border">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-muted-foreground">{t.admin.noReports}</p>
        </div>
      )}

      {/* ── AI Risk (Churn + CLV) ── */}
      {tab === "ai-risk" && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          {churnData && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-red-600">{churnData.high_risk_count}</p>
                <p className="text-sm text-red-700 font-medium mt-1">Risque élevé</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-yellow-600">{churnData.medium_risk_count}</p>
                <p className="text-sm text-yellow-700 font-medium mt-1">Risque moyen</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-green-600">{churnData.low_risk_count}</p>
                <p className="text-sm text-green-700 font-medium mt-1">Risque faible</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2">
            {(['', 'HIGH', 'MEDIUM', 'LOW'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setChurnRiskFilter(f); loadChurnData(f); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                  churnRiskFilter === f ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-accent'
                }`}
              >
                {f === '' ? 'Tous' : f === 'HIGH' ? 'Élevé' : f === 'MEDIUM' ? 'Moyen' : 'Faible'}
              </button>
            ))}
            <button
              onClick={() => loadChurnData(churnRiskFilter)}
              className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg bg-accent border border-border hover:bg-primary hover:text-white transition-colors"
            >
              Actualiser
            </button>
          </div>

          {/* Table */}
          {churnLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !churnData || churnData.predictions.length === 0 ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border">
              <p className="text-4xl mb-4">🤖</p>
              <p className="text-muted-foreground">Aucune donnée disponible. Cliquez sur Actualiser.</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-accent border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Risque</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">CLV</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">R/F/M</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions recommandées</th>
                  </tr>
                </thead>
                <tbody>
                  {churnData.predictions.map((p: any) => (
                    <tr key={p.user_id} className="border-b border-border hover:bg-accent">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.user_id.slice(0, 12)}…</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          p.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' :
                          p.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {p.risk_level === 'HIGH' ? 'ÉLEVÉ' : p.risk_level === 'MEDIUM' ? 'MOYEN' : 'FAIBLE'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.churn_score >= 0.65 ? 'bg-red-500' : p.churn_score >= 0.35 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.round(p.churn_score * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{Math.round(p.churn_score * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${p.clv_tier === 'HIGH' ? 'text-green-600' : p.clv_tier === 'MEDIUM' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {p.clv_estimate > 0 ? `${p.clv_estimate.toLocaleString('fr-MA')} Dhs` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.rfm_recency}/{p.rfm_frequency}/{p.rfm_monetary}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.recommended_actions.slice(0, 2).map((a: string) => (
                            <span key={a} className="px-1.5 py-0.5 rounded bg-muted text-xs text-foreground/70">
                              {a.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
