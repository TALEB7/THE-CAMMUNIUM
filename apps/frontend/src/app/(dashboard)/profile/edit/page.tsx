'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { INTEREST_CATEGORIES } from '@communium/shared';
import { AvatarCropUpload } from '@/components/profile/avatar-crop-upload';

interface WorkHistoryEntry { title: string; company: string; startDate: string; endDate: string; }

export default function EditProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileType = searchParams.get('type') || 'personal';
  const isBusinessProfile = profileType === 'business';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state — populated from existing profile
  const [fields, setFields] = useState<Record<string, string>>({});
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [workHistory, setWorkHistory] = useState<WorkHistoryEntry[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Load existing profile data
  useEffect(() => {
    api.get('/profiles/me')
      .then((r) => {
        const p = r.data;
        setAvatarUrl(p.avatarUrl || '');
        setSelectedInterests(p.interests || []);
        setWorkHistory(p.workHistory || []);
        // Pre-fill all text fields from profile
        const f: Record<string, string> = {};
        const textFields = isBusinessProfile
          ? ['companyName', 'rc', 'creationDate', 'phone', 'email', 'country', 'city', 'address', 'activities', 'ice', 'ifNumber']
          : ['firstName', 'lastName', 'birthday', 'identityType', 'identityNumber', 'phone', 'email', 'country', 'city', 'address', 'profession'];
        textFields.forEach((k) => { if (p[k] != null) f[k] = String(p[k]); });
        setFields(f);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [isBusinessProfile]);

  const set = (key: string, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  const addWorkEntry = () => setWorkHistory([...workHistory, { title: '', company: '', startDate: '', endDate: '' }]);
  const removeWorkEntry = (i: number) => setWorkHistory(workHistory.filter((_, idx) => idx !== i));
  const updateWorkEntry = (i: number, field: keyof WorkHistoryEntry, value: string) => {
    const updated = [...workHistory];
    updated[i][field] = value;
    setWorkHistory(updated);
  };
  const toggleInterest = (interest: string) =>
    setSelectedInterests((prev) => prev.includes(interest) ? prev.filter((x) => x !== interest) : [...prev, interest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Only send non-empty fields
    const payload: Record<string, any> = {};
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== '') payload[k] = v; });
    if (avatarUrl) payload.avatarUrl = avatarUrl;
    if (selectedInterests.length > 0) payload.interests = selectedInterests;
    if (!isBusinessProfile && workHistory.length > 0) payload.workHistory = workHistory;
    payload.accountType = isBusinessProfile ? 'business' : 'personal';

    try {
      await api.put('/profiles/me', payload);
      setSuccess(true);
      setTimeout(() => router.push('/profile'), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const status = err?.response?.status;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || `Erreur ${status || ''} lors de la sauvegarde.`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary font-heading tracking-wide">
          {isBusinessProfile ? 'Profil Business' : 'Profil Personnel'}
        </h1>
        <p className="text-muted-foreground text-sm">Modifiez uniquement les champs que vous souhaitez changer.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <Card>
          <CardHeader><CardTitle>Photo de profil</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <AvatarCropUpload
              currentUrl={avatarUrl}
              onUploadComplete={(url) => setAvatarUrl(url)}
            />
          </CardContent>
        </Card>

        {/* ===== PERSONAL FIELDS ===== */}
        {!isBusinessProfile && (
          <>
            <Card>
              <CardHeader><CardTitle>Identité</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Prénom">
                  <input value={fields.firstName || ''} onChange={(e) => set('firstName', e.target.value)} className="form-input" placeholder="Prénom" />
                </FormField>
                <FormField label="Nom">
                  <input value={fields.lastName || ''} onChange={(e) => set('lastName', e.target.value)} className="form-input" placeholder="Nom" />
                </FormField>
                <FormField label="Date de naissance">
                  <input value={fields.birthday || ''} onChange={(e) => set('birthday', e.target.value)} type="date" className="form-input" />
                </FormField>
                <FormField label="Type d'identité">
                  <select value={fields.identityType || 'cin'} onChange={(e) => set('identityType', e.target.value)} className="form-input">
                    <option value="cin">CIN</option>
                    <option value="passport">Passeport</option>
                  </select>
                </FormField>
                <FormField label="Numéro d'identité">
                  <input value={fields.identityNumber || ''} onChange={(e) => set('identityNumber', e.target.value)} className="form-input" placeholder="Ex: AB123456" />
                </FormField>
                <FormField label="Profession">
                  <input value={fields.profession || ''} onChange={(e) => set('profession', e.target.value)} className="form-input" placeholder="Développeur, Comptable..." />
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email">
                  <input value={fields.email || ''} onChange={(e) => set('email', e.target.value)} type="email" className="form-input" />
                </FormField>
                <FormField label="Téléphone">
                  <input value={fields.phone || ''} onChange={(e) => set('phone', e.target.value)} className="form-input" placeholder="+212 6XX XXX XXX" />
                </FormField>
                <FormField label="Pays">
                  <select value={fields.country || 'Maroc'} onChange={(e) => set('country', e.target.value)} className="form-input">
                    {['Maroc','France','Belgique','Canada','USA','Suisse','Espagne'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Ville">
                  <input value={fields.city || ''} onChange={(e) => set('city', e.target.value)} className="form-input" placeholder="Tanger, Casablanca..." />
                </FormField>
                <FormField label="Adresse" className="sm:col-span-2">
                  <input value={fields.address || ''} onChange={(e) => set('address', e.target.value)} className="form-input" placeholder="Adresse complète" />
                </FormField>
              </CardContent>
            </Card>

            {/* Work History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expériences professionnelles</CardTitle>
                <button type="button" onClick={addWorkEntry} className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <Plus className="h-4 w-4" /> Ajouter
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {workHistory.length === 0 && <p className="text-sm text-muted-foreground">Aucune expérience ajoutée</p>}
                {workHistory.map((entry, i) => (
                  <div key={i} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                    <input value={entry.title} onChange={(e) => updateWorkEntry(i, 'title', e.target.value)} className="form-input" placeholder="Poste" />
                    <input value={entry.company} onChange={(e) => updateWorkEntry(i, 'company', e.target.value)} className="form-input" placeholder="Entreprise" />
                    <input value={entry.startDate} onChange={(e) => updateWorkEntry(i, 'startDate', e.target.value)} type="date" className="form-input" />
                    <div className="flex items-center gap-2">
                      <input value={entry.endDate} onChange={(e) => updateWorkEntry(i, 'endDate', e.target.value)} type="date" className="form-input flex-1" />
                      <button type="button" onClick={() => removeWorkEntry(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* ===== BUSINESS FIELDS ===== */}
        {isBusinessProfile && (
          <>
            <Card>
              <CardHeader><CardTitle>Informations entreprise</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nom de l'entreprise">
                  <input value={fields.companyName || ''} onChange={(e) => set('companyName', e.target.value)} className="form-input" placeholder="Nom" />
                </FormField>
                <FormField label="Registre de Commerce">
                  <input value={fields.rc || ''} onChange={(e) => set('rc', e.target.value)} className="form-input" placeholder="N° RC" />
                </FormField>
                <FormField label="Date de création">
                  <input value={fields.creationDate || ''} onChange={(e) => set('creationDate', e.target.value)} type="date" className="form-input" />
                </FormField>
                <FormField label="ICE">
                  <input value={fields.ice || ''} onChange={(e) => set('ice', e.target.value)} className="form-input" placeholder="Identifiant Commun" />
                </FormField>
                <FormField label="IF (Identifiant Fiscal)">
                  <input value={fields.ifNumber || ''} onChange={(e) => set('ifNumber', e.target.value)} className="form-input" placeholder="N° IF" />
                </FormField>
                <FormField label="Activités">
                  <input value={fields.activities || ''} onChange={(e) => set('activities', e.target.value)} className="form-input" placeholder="Secteurs d'activité" />
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Contact entreprise</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email">
                  <input value={fields.email || ''} onChange={(e) => set('email', e.target.value)} type="email" className="form-input" />
                </FormField>
                <FormField label="Téléphone">
                  <input value={fields.phone || ''} onChange={(e) => set('phone', e.target.value)} className="form-input" placeholder="+212 5XX XXX XXX" />
                </FormField>
                <FormField label="Pays">
                  <select value={fields.country || 'Maroc'} onChange={(e) => set('country', e.target.value)} className="form-input">
                    {['Maroc','France','Belgique','USA','Suisse'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Ville">
                  <input value={fields.city || ''} onChange={(e) => set('city', e.target.value)} className="form-input" placeholder="Tanger, Casablanca..." />
                </FormField>
                <FormField label="Adresse" className="sm:col-span-2">
                  <input value={fields.address || ''} onChange={(e) => set('address', e.target.value)} className="form-input" placeholder="Adresse complète" />
                </FormField>
              </CardContent>
            </Card>
          </>
        )}

        {/* Interests */}
        <Card>
          <CardHeader><CardTitle>Centres d&apos;intérêt</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTEREST_CATEGORIES.map((interest) => (
                <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${selectedInterests.includes(interest) ? 'border-primary bg-accent text-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                  {interest}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        {success && (
          <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">Profil enregistré avec succès !</div>
        )}

        <button type="submit" disabled={loading}
          className="ygo-btn-blue w-full py-3 font-medium disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
