'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-client';
import { api } from '@/lib/api';
import { getMediaUrl } from '@/lib/media-url';
import Link from 'next/link';
import {
  MapPin, Mail, Phone, Briefcase, Calendar, Link2,
  MessageSquare, UserPlus, UserCheck, Award, ShoppingBag,
  CheckCircle, ArrowLeft,
} from 'lucide-react';

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const isOwnProfile = userId === id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: () => api.get(`/profiles/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: connection } = useQuery({
    queryKey: ['connection-status', id],
    queryFn: () => api.get(`/connections/status/${id}`).then((r) => r.data),
    enabled: !!userId && !isOwnProfile,
  });

  const connect = useMutation({
    mutationFn: () => api.post('/connections/request', { toId: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connection-status', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-muted-foreground">Profil introuvable.</p>
        <Link href="/search" className="mt-4 inline-block text-sm text-primary hover:underline">
          Rechercher des membres
        </Link>
      </div>
    );
  }

  const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  const avatarUrl = getMediaUrl(profile.avatarUrl);
  const isConnected = connection?.status === 'ACCEPTED';
  const isPending  = connection?.status === 'PENDING';

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Back */}
      <Link href="/connections" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-r from-[#C8102E] to-[#E8233E]" />

        <div className="px-6 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-card bg-accent overflow-hidden flex items-center justify-center">
              {avatarUrl
                ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-primary">{name[0]}</span>}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-1">
              {isOwnProfile ? (
                <Link href="/profile/edit"
                  className="px-4 py-1.5 text-sm font-semibold border border-primary text-primary rounded-full hover:bg-primary/5 transition">
                  Modifier le profil
                </Link>
              ) : (
                <>
                  <Link href={`/messages?to=${id}`}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold border border-border text-foreground rounded-full hover:bg-accent transition">
                    <MessageSquare className="h-4 w-4" /> Message
                  </Link>
                  {isConnected ? (
                    <div className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-accent text-foreground rounded-full">
                      <UserCheck className="h-4 w-4 text-green-500" /> Connecté
                    </div>
                  ) : isPending ? (
                    <div className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-accent text-muted-foreground rounded-full">
                      En attente…
                    </div>
                  ) : (
                    <button
                      onClick={() => connect.mutate()}
                      disabled={connect.isPending}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold bg-primary text-black rounded-full hover:brightness-110 disabled:opacity-60 transition"
                    >
                      <UserPlus className="h-4 w-4" /> Se connecter
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Name & headline */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{name}</h1>
            {profile.isVerified && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {profile.profession || profile.companyName || profile.activities || 'Membre The Communium'}
          </p>

          {/* Location & contact */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            {profile.city && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.city}, {profile.country || 'Maroc'}</span>
            )}
            {profile.email && (
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{profile.email}</span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{profile.profileViews ?? 0}</p>
              <p className="text-xs text-muted-foreground">Vues</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{profile.accountType === 'business' ? 'Business' : 'Personnel'}</p>
              <p className="text-xs text-muted-foreground">Type</p>
            </div>
            {profile.tksBalance != null && (
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{profile.tksBalance}</p>
                <p className="text-xs text-muted-foreground">Tks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interests */}
      {profile.interests?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-3">Centres d'intérêt</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((i: string) => (
              <span key={i} className="px-3 py-1 bg-accent text-xs font-medium rounded-full text-foreground">{i}</span>
            ))}
          </div>
        </div>
      )}

      {/* Work history */}
      {profile.workHistory?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" /> Expériences
          </h2>
          <div className="space-y-4">
            {profile.workHistory.map((job: any, i: number) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {job.startDate} — {job.endDate || 'Présent'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/marketplace?seller=${id}`}
            className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-accent transition text-sm text-muted-foreground hover:text-foreground">
            <ShoppingBag className="h-4 w-4 text-primary" /> Voir ses annonces
          </Link>
          <Link href="/connections"
            className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-accent transition text-sm text-muted-foreground hover:text-foreground">
            <Link2 className="h-4 w-4 text-primary" /> Connexions communes
          </Link>
          <Link href="/mentorship"
            className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-accent transition text-sm text-muted-foreground hover:text-foreground">
            <Award className="h-4 w-4 text-primary" /> Demander un mentorat
          </Link>
          <Link href={`/messages?to=${id}`}
            className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-accent transition text-sm text-muted-foreground hover:text-foreground">
            <MessageSquare className="h-4 w-4 text-primary" /> Envoyer un message
          </Link>
        </div>
      </div>
    </div>
  );
}
