'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@/lib/auth-client';
import { api } from '@/lib/api';
import { getMediaUrl } from '@/lib/media-url';
import Link from 'next/link';
import { AiInsightsWidget } from '@/components/ai/ai-insights-widget';
import { OnboardingBanner } from '@/components/layout/onboarding-banner';
import {
  Image, FileText, Calendar, Users, Briefcase,
  ThumbsUp, MessageCircle, Share2, Eye,
  TrendingUp, UserPlus, ChevronRight,
  Award, ShoppingBag, GraduationCap,
  X, Upload, Loader2, Check, Globe,
} from 'lucide-react';

// ─── Create Post Modal ─────────────────────────────────────────────────────
function CreatePostModal({
  mode, avatarUrl, name, userId, onClose,
}: {
  mode: 'photo' | 'article';
  avatarUrl?: string | null;
  name: string;
  userId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const { data: forums } = useQuery({
    queryKey: ['forums-list'],
    queryFn: () => api.get('/forums').then((r) => r.data as { id: string; slug: string }[]),
    staleTime: 5 * 60 * 1000,
  });
  const generalForumId = forums?.find((f) => f.slug === 'general')?.id ?? forums?.[0]?.id;

  const submit = useMutation({
    mutationFn: () => api.post('/forums/posts', {
      forumId: generalForumId,
      authorId: userId,
      title: mode === 'article' ? title || 'Article sans titre' : text.slice(0, 60) || 'Photo partagée',
      content: text,
      tags: [mode === 'photo' ? 'photo' : 'article'],
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['home-feed'] });
      onClose();
    },
    onError: (err: any) => {
      console.error('Post creation failed:', err?.response?.data || err);
    },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (mode === 'photo') {
      setPreviewUrl(URL.createObjectURL(file));
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('files', file);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/uploads/listings`, { method: 'POST', body: formData });
      const data = await res.json();
      setUploadedUrl(data.urls?.[0] ?? data.url);
    } catch { /* ignore */ }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent overflow-hidden flex items-center justify-center">
              {avatarUrl
                ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                : <span className="font-bold text-primary">{name[0]}</span>}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" /> Public
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">

          {/* Article title */}
          {mode === 'article' && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article…"
              className="w-full text-base font-semibold bg-transparent border-b border-border pb-2 focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
          )}

          {/* Text area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mode === 'photo'
              ? 'Décrivez votre photo…'
              : 'Rédigez votre article. Partagez vos connaissances, une expérience, un conseil…'}
            rows={mode === 'article' ? 6 : 3}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
          />

          {/* Image preview */}
          {mode === 'photo' && previewUrl && (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={previewUrl} alt="preview" className="w-full max-h-64 object-cover" />
              <button
                onClick={() => { setPreviewUrl(null); setUploadedUrl(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          )}

          {/* PDF indicator */}
          {mode === 'article' && fileName && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs text-foreground">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{fileName}</span>
              {uploading && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
              {!uploading && uploadedUrl && <Check className="h-3 w-3 text-green-500 ml-auto" />}
            </div>
          )}

          {/* Error */}
          {submit.isError && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
              ⚠ Erreur lors de la publication. Vérifiez que vous êtes connecté.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          {/* Upload button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition disabled:opacity-50"
          >
            {mode === 'photo'
              ? <><Image className="h-4 w-4 text-green-500" /> {previewUrl ? 'Changer la photo' : 'Ajouter une photo'}</>
              : <><Upload className="h-4 w-4 text-orange-500" /> Joindre un PDF</>}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={mode === 'photo' ? 'image/*' : '.pdf,image/*'}
            className="hidden"
            onChange={handleFile}
          />

          {/* Submit */}
          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || uploading || (!text.trim() && !uploadedUrl)}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-black text-sm font-bold rounded-xl hover:brightness-110 disabled:opacity-50 transition"
          >
            {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publier
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post composer bar ──────────────────────────────────────────────────────
function PostComposer({
  avatarUrl, name, userId,
}: {
  avatarUrl?: string | null; name: string; userId: string;
}) {
  const [modal, setModal] = useState<'photo' | 'article' | null>(null);

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-accent border border-border overflow-hidden flex items-center justify-center shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              : <span className="text-sm font-bold text-primary">{name[0]}</span>}
          </div>
          <button
            onClick={() => setModal('article')}
            className="flex-1 px-4 py-2.5 rounded-full border border-border text-sm text-muted-foreground hover:bg-accent hover:border-foreground/30 transition text-left"
          >
            Partagez une publication…
          </button>
        </div>

        <div className="flex gap-1">
          {[
            { icon: Image,    label: 'Photo',     color: 'text-green-500',  action: () => setModal('photo') },
            { icon: FileText, label: 'Article',   color: 'text-orange-500', action: () => setModal('article') },
            { icon: Calendar, label: 'Événement', color: 'text-red-500',    action: () => { window.location.href = '/events'; } },
            { icon: Users,    label: 'Groupe',    color: 'text-blue-500',   action: () => { window.location.href = '/groups'; } },
          ].map(({ icon: Icon, label, color, action }) => (
            <button key={label} onClick={action}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {modal && (
        <CreatePostModal
          mode={modal}
          avatarUrl={avatarUrl}
          name={name}
          userId={userId}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ─── Feed item ─────────────────────────────────────────────────────────────
function FeedItem({ item }: { item: any }) {
  const icons: Record<string, string> = {
    POST: '💬', LISTING: '🛍️', GROUP_JOIN: '👥',
    EVENT: '📅', CONNECTION: '🤝', ACHIEVEMENT: '🏆',
    AUCTION: '🔨', MENTORSHIP: '🎓',
  };
  const avatarUrl = getMediaUrl(item.user?.avatarUrl);
  const name = `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() || 'Membre';

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-accent border border-border overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl
            ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-primary">{name[0]}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{formatTime(item.createdAt)}</p>
        </div>
        <span className="text-lg">{icons[item.action] || '📌'}</span>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed">
        {item.body || item.title || item.description || 'Nouvelle activité'}
      </p>

      {item.metadata?.imageUrl && (
        <img
          src={getMediaUrl(item.metadata.imageUrl) || item.metadata.imageUrl}
          alt=""
          className="mt-3 w-full rounded-lg object-cover max-h-72"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
        {[
          { icon: ThumbsUp, label: "J'aime" },
          { icon: MessageCircle, label: 'Commenter' },
          { icon: Share2, label: 'Partager' },
        ].map(({ icon: Icon, label }) => (
          <button key={label}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition">
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Right panel ───────────────────────────────────────────────────────────
function RightPanel({ stats }: { stats: any }) {
  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Votre activité</h3>
        <div className="space-y-2">
          {[
            { icon: Eye,          label: 'Vues profil',       value: stats?.profileViews ?? 0 },
            { icon: TrendingUp,   label: 'Annonces actives',  value: stats?.listings ?? 0 },
            { icon: GraduationCap,label: 'Sessions mentorat', value: stats?.mentorshipSessions ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />{label}
              </div>
              <span className="text-xs font-bold text-primary">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Explorer</h3>
        <div className="space-y-1">
          {[
            { label: 'Trouver un mentor',    href: '/mentorship',       icon: GraduationCap },
            { label: 'Parcourir le marché',  href: '/marketplace',      icon: ShoppingBag },
            { label: 'Rejoindre un groupe',  href: '/groups',           icon: Users },
            { label: 'Créer une entreprise', href: '/company-creation', icon: Briefcase },
            { label: 'Connecter des membres',href: '/connections',      icon: UserPlus },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center justify-between py-2 text-xs text-muted-foreground hover:text-foreground group transition">
              <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{label}</div>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
            </Link>
          ))}
        </div>
      </div>

      <AiInsightsWidget />

      <p className="text-[10px] text-muted-foreground text-center px-2">
        © 2026 The Communium ·{' '}
        <Link href="/faq" className="hover:underline">Aide</Link> ·{' '}
        <Link href="/contact" className="hover:underline">Contact</Link>
      </p>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatTime(date: string) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { userId } = useAuth();
  const { user } = useUser();

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => api.get(`/analytics/dashboard/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const { data: profile } = useQuery({
    queryKey: ['my-profile', userId],
    queryFn: () => api.get('/profiles/me').then((r) => r.data),
    enabled: !!userId,
    staleTime: 60000,
  });

  const { data: feed = [] } = useQuery({
    queryKey: ['home-feed', userId],
    queryFn: () => api.get('/activity-feed/global?limit=20').then((r) => r.data?.data || r.data || []),
    enabled: !!userId,
    staleTime: 30000,
  });

  const stats = { ...dashboard?.stats, profileViews: dashboard?.user?.profileViews };
  const avatarUrl = getMediaUrl(profile?.avatarUrl);
  const name = `${profile?.firstName || user?.firstName || ''} ${profile?.lastName || user?.lastName || ''}`.trim() || 'Membre';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

        {/* Feed */}
        <div className="space-y-3 min-w-0">
          <OnboardingBanner />
          <PostComposer avatarUrl={avatarUrl} name={name} userId={userId || ''} />

          {feed.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <p className="text-muted-foreground text-sm">Aucune activité pour le moment.</p>
              <p className="text-xs text-muted-foreground mt-1">Connectez-vous avec des membres pour voir leur actualité.</p>
              <Link href="/connections" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
                Trouver des connexions →
              </Link>
            </div>
          ) : (
            feed.map((item: any) => <FeedItem key={item.id} item={item} />)
          )}
        </div>

        {/* Right */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <RightPanel stats={stats} />
          </div>
        </div>

      </div>
    </div>
  );
}
