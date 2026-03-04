'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, MapPin, Mail, Phone, Briefcase, Building2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function ProfilePage() {
  const { t } = useT();
  let clerkUser: any = null;
  try {
    const clerk = require('@clerk/nextjs');
    const result = clerk.useUser();
    clerkUser = result?.user;
  } catch {
    // Clerk not configured
  }

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles/me').then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c9a730] border-t-transparent" />
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
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e8eaf6] text-2xl font-bold text-[#1a237e] border-2 border-[#c9a730]">
                {clerkUser?.firstName?.[0]}
                {clerkUser?.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading">
                  {profile?.firstName || clerkUser?.firstName}{' '}
                  {profile?.lastName || clerkUser?.lastName}
                </h1>
                <p className="text-gray-500">{profile?.profession || 'Profession non renseignée'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={profile?.accountType === 'business' ? 'default' : 'secondary'}>
                    {profile?.accountType === 'business' ? 'Business' : 'Personnel'}
                  </Badge>
                  {profile?.isVerified && (
                    <Badge className="bg-green-100 text-green-800">Vérifié</Badge>
                  )}
                </div>
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="flex items-center gap-2 rounded border border-[#c9a730]/50 px-4 py-2 text-sm font-medium text-[#1a237e] hover:bg-[#fff8e1] transition"
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
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile?.email || clerkUser?.primaryEmailAddress?.emailAddress} />
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
                <div key={i} className="border-l-2 border-[#c9a730] pl-4">
                  <h4 className="font-medium text-gray-900">{job.title}</h4>
                  <p className="text-sm text-gray-600">{job.company}</p>
                  <p className="text-xs text-gray-400">
                    {job.startDate} - {job.endDate || 'Présent'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune expérience ajoutée</p>
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
            <p className="text-sm text-gray-400">Aucun intérêt ajouté</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400">{icon}</span>
      <span className="w-24 text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
