'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, MapPin, Mail, Phone, Briefcase, Building2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media-url';
import KycStatusBadge from '@/components/kyc/KycStatusBadge';

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;


  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles/me').then((res) => res.data),
  });

  const { data: kyc } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => api.get('/kyc/status').then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 rounded-full border-2 border-primary overflow-hidden bg-accent flex items-center justify-center">
                {getMediaUrl(profile?.avatarUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getMediaUrl(profile.avatarUrl)!}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    {user?.lastName?.[0]}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-primary font-heading">
                  {profile?.firstName || user?.firstName}{' '}
                  {profile?.lastName || user?.lastName}
                </h1>
                <p className="text-muted-foreground">{profile?.profession || 'Profession non renseignée'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={profile?.accountType === 'business' ? 'default' : 'secondary'}>
                    {profile?.accountType === 'business' ? 'Business' : 'Personnel'}
                  </Badge>
                  {profile?.isVerified && (
                    <Badge className="bg-green-100 text-green-800">Vérifié</Badge>
                  )}
                  {kyc && kyc.status && kyc.status !== 'none' && (
                    <div className="ml-2">
                      <KycStatusBadge status={kyc.status} type={kyc.type || profile?.accountType} />
                    </div>
                  )}
                  {profile?.accountType !== 'business' && (!kyc || kyc.status === 'none' || kyc.status === 'rejected') && (
                    <Link
                      href="/onboarding/verify/personal"
                      className="ml-2 text-xs font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Vérifier mon identité
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="flex items-center gap-2 rounded border border-primary/50 px-4 py-2 text-sm font-medium text-primary hover:bg-accent transition"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile?.email || user?.email} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={profile?.phone || 'Non renseigné'} />
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Ville" value={profile?.city ? `${profile.city}, ${profile.country}` : 'Non renseigné'} />
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations professionnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Profession" value={profile?.profession || 'Non renseigné'} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Entreprise" value={profile?.company || 'Non renseigné'} />
          <InfoRow icon={<Calendar className="h-4 w-4" />} label="Membre depuis" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : '-'} />
        </CardContent>
      </Card>

      {/* Work History */}
      <Card>
        <CardHeader>
          <CardTitle>Expériences professionnelles</CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.workHistory && profile.workHistory.length > 0 ? (
            <div className="space-y-4">
              {profile.workHistory.map((job: any, i: number) => (
                <div key={i} className="border-l-2 border-primary pl-4">
                  <h4 className="font-medium text-foreground">{job.title}</h4>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.startDate} - {job.endDate || 'Présent'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune expérience ajoutée</p>
          )}
        </CardContent>
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader>
          <CardTitle>Centres d&apos;intérêt</CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.interests && profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest: string, i: number) => (
                <Badge key={i} variant="outline">
                  {interest}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun intérêt ajouté</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="w-24 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
