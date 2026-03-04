'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { INTEREST_CATEGORIES } from '@communium/shared';

// ---------- Personal Profile Schema ----------
const personalProfileSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  birthday: z.string().min(1, 'Date de naissance requise'),
  identityType: z.enum(['cin', 'passport']),
  identityNumber: z.string().min(1, 'Numéro d\'identité requis'),
  phone: z.string().min(8, 'Numéro de téléphone requis'),
  email: z.string().email('Email invalide'),
  country: z.string().min(1, 'Pays requis'),
  city: z.string().min(1, 'Ville requise'),
  address: z.string().min(1, 'Adresse requise'),
  profession: z.string().min(1, 'Profession requise'),
});

// ---------- Business Profile Schema ----------
const businessProfileSchema = z.object({
  companyName: z.string().min(2, 'Nom de l\'entreprise requis'),
  rc: z.string().min(1, 'Registre de Commerce requis'),
  creationDate: z.string().min(1, 'Date de création requise'),
  phone: z.string().min(8, 'Téléphone requis'),
  email: z.string().email('Email invalide'),
  country: z.string().min(1, 'Pays requis'),
  city: z.string().min(1, 'Ville requise'),
  address: z.string().min(1, 'Adresse requise'),
  activities: z.string().min(1, 'Activités requises'),
  ice: z.string().optional(),
  ifNumber: z.string().optional(),
});

type PersonalProfile = z.infer<typeof personalProfileSchema>;
type BusinessProfile = z.infer<typeof businessProfileSchema>;

interface WorkHistoryEntry {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
}

export default function EditProfilePage() {
  const { t } = useT();
  let clerkUser: any = null;
  try {
    const clerk = require('@clerk/nextjs');
    const result = clerk.useUser();
    clerkUser = result?.user;
  } catch {
    // Clerk not configured
  }
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileType = searchParams.get('type') || 'personal';
  const isBusinessProfile = profileType === 'business';

  const [loading, setLoading] = useState(false);
  const [workHistory, setWorkHistory] = useState<WorkHistoryEntry[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Personal profile form
  const personalForm = useForm<PersonalProfile>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      firstName: clerkUser?.firstName || '',
      lastName: clerkUser?.lastName || '',
      email: clerkUser?.primaryEmailAddress?.emailAddress || '',
      identityType: 'cin',
      country: 'Maroc',
    },
  });

  // Business profile form
  const businessForm = useForm<BusinessProfile>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      email: clerkUser?.primaryEmailAddress?.emailAddress || '',
      country: 'Maroc',
    },
  });

  const addWorkEntry = () => {
    setWorkHistory([...workHistory, { title: '', company: '', startDate: '', endDate: '' }]);
  };

  const removeWorkEntry = (index: number) => {
    setWorkHistory(workHistory.filter((_, i) => i !== index));
  };

  const updateWorkEntry = (index: number, field: keyof WorkHistoryEntry, value: string) => {
    const updated = [...workHistory];
    updated[index][field] = value;
    setWorkHistory(updated);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const onSubmitPersonal = async (data: PersonalProfile) => {
    setLoading(true);
    try {
      await api.put('/profiles/me', {
        ...data,
        accountType: 'personal',
        workHistory,
        interests: selectedInterests,
      });
      router.push('/profile');
    } catch (error) {
      console.error('Save profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitBusiness = async (data: BusinessProfile) => {
    setLoading(true);
    try {
      await api.put('/profiles/me', {
        ...data,
        accountType: 'business',
        interests: selectedInterests,
      });
      router.push('/profile');
    } catch (error) {
      console.error('Save profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading tracking-wide">
          {isBusinessProfile ? 'Profil Business' : 'Profil Personnel'}
        </h1>
        <p className="text-gray-500">Complétez vos informations pour être visible sur la plateforme</p>
      </div>

      {/* ========== PERSONAL PROFILE FORM ========== */}
      {!isBusinessProfile && (
        <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-6">
          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle>Identité</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Prénom" error={personalForm.formState.errors.firstName?.message}>
                <input {...personalForm.register('firstName')} className="form-input" placeholder="Prénom" />
              </FormField>
              <FormField label="Nom" error={personalForm.formState.errors.lastName?.message}>
                <input {...personalForm.register('lastName')} className="form-input" placeholder="Nom" />
              </FormField>
              <FormField label="Date de naissance" error={personalForm.formState.errors.birthday?.message}>
                <input {...personalForm.register('birthday')} type="date" className="form-input" />
              </FormField>
              <FormField label="Type d'identité">
                <select {...personalForm.register('identityType')} className="form-input">
                  <option value="cin">CIN</option>
                  <option value="passport">Passeport</option>
                </select>
              </FormField>
              <FormField label="Numéro d'identité" error={personalForm.formState.errors.identityNumber?.message}>
                <input {...personalForm.register('identityNumber')} className="form-input" placeholder="Ex: AB123456" />
              </FormField>
              <FormField label="Profession" error={personalForm.formState.errors.profession?.message}>
                <input {...personalForm.register('profession')} className="form-input" placeholder="Développeur, Comptable..." />
              </FormField>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Email" error={personalForm.formState.errors.email?.message}>
                <input {...personalForm.register('email')} type="email" className="form-input" />
              </FormField>
              <FormField label="Téléphone" error={personalForm.formState.errors.phone?.message}>
                <input {...personalForm.register('phone')} className="form-input" placeholder="+212 6XX XXX XXX" />
              </FormField>
              <FormField label="Pays" error={personalForm.formState.errors.country?.message}>
                <select {...personalForm.register('country')} className="form-input">
                  <option value="Maroc">Maroc</option>
                  <option value="France">France</option>
                  <option value="Belgique">Belgique</option>
                  <option value="Canada">Canada</option>
                  <option value="USA">États-Unis</option>
                  <option value="Suisse">Suisse</option>
                  <option value="Espagne">Espagne</option>
                </select>
              </FormField>
              <FormField label="Ville" error={personalForm.formState.errors.city?.message}>
                <input {...personalForm.register('city')} className="form-input" placeholder="Tanger, Casablanca..." />
              </FormField>
              <FormField label="Adresse" error={personalForm.formState.errors.address?.message}>
                <input {...personalForm.register('address')} className="form-input col-span-2" placeholder="Adresse complète" />
              </FormField>
            </CardContent>
          </Card>

          {/* Work History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expériences professionnelles</CardTitle>
              <button type="button" onClick={addWorkEntry} className="flex items-center gap-1 text-sm text-[#c9a730] hover:underline">
                <Plus className="h-4 w-4" /> Ajouter
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {workHistory.length === 0 && (
                <p className="text-sm text-gray-400">Aucune expérience ajoutée</p>
              )}
              {workHistory.map((entry, i) => (
                <div key={i} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                  <input value={entry.title} onChange={(e) => updateWorkEntry(i, 'title', e.target.value)} className="form-input" placeholder="Poste" />
                  <input value={entry.company} onChange={(e) => updateWorkEntry(i, 'company', e.target.value)} className="form-input" placeholder="Entreprise" />
                  <input value={entry.startDate} onChange={(e) => updateWorkEntry(i, 'startDate', e.target.value)} type="date" className="form-input" />
                  <div className="flex items-center gap-2">
                    <input value={entry.endDate} onChange={(e) => updateWorkEntry(i, 'endDate', e.target.value)} type="date" className="form-input flex-1" />
                    <button type="button" onClick={() => removeWorkEntry(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Centres d&apos;intérêt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {INTEREST_CATEGORIES.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      selectedInterests.includes(interest)
                        ? 'border-[#c9a730] bg-[#fff8e1] text-[#1a237e]'
                        : 'border-gray-200 text-gray-600 hover:border-[#c9a730]'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  Photo
                </div>
                <label className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Choisir une photo
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              </div>
            </CardContent>
          </Card>

          <button
            type="submit"
            disabled={loading}
            className="ygo-btn-blue w-full py-3 font-medium disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le profil'}
          </button>
        </form>
      )}

      {/* ========== BUSINESS PROFILE FORM ========== */}
      {isBusinessProfile && (
        <form onSubmit={businessForm.handleSubmit(onSubmitBusiness)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations entreprise</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nom de l'entreprise" error={businessForm.formState.errors.companyName?.message}>
                <input {...businessForm.register('companyName')} className="form-input" placeholder="Nom de l'entreprise" />
              </FormField>
              <FormField label="Registre de Commerce (RC)" error={businessForm.formState.errors.rc?.message}>
                <input {...businessForm.register('rc')} className="form-input" placeholder="N° RC" />
              </FormField>
              <FormField label="Date de création" error={businessForm.formState.errors.creationDate?.message}>
                <input {...businessForm.register('creationDate')} type="date" className="form-input" />
              </FormField>
              <FormField label="ICE">
                <input {...businessForm.register('ice')} className="form-input" placeholder="Identifiant Commun de l'Entreprise" />
              </FormField>
              <FormField label="IF (Identifiant Fiscal)">
                <input {...businessForm.register('ifNumber')} className="form-input" placeholder="N° IF" />
              </FormField>
              <FormField label="Activités" error={businessForm.formState.errors.activities?.message}>
                <input {...businessForm.register('activities')} className="form-input" placeholder="Secteurs d'activité" />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact entreprise</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Email" error={businessForm.formState.errors.email?.message}>
                <input {...businessForm.register('email')} type="email" className="form-input" />
              </FormField>
              <FormField label="Téléphone" error={businessForm.formState.errors.phone?.message}>
                <input {...businessForm.register('phone')} className="form-input" placeholder="+212 5XX XXX XXX" />
              </FormField>
              <FormField label="Pays" error={businessForm.formState.errors.country?.message}>
                <select {...businessForm.register('country')} className="form-input">
                  <option value="Maroc">Maroc</option>
                  <option value="France">France</option>
                  <option value="Belgique">Belgique</option>
                  <option value="USA">États-Unis</option>
                  <option value="Suisse">Suisse</option>
                </select>
              </FormField>
              <FormField label="Ville" error={businessForm.formState.errors.city?.message}>
                <input {...businessForm.register('city')} className="form-input" placeholder="Tanger, Casablanca..." />
              </FormField>
              <FormField label="Adresse" error={businessForm.formState.errors.address?.message}>
                <input {...businessForm.register('address')} className="form-input" placeholder="Adresse complète" />
              </FormField>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Logo de l&apos;entreprise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  Logo
                </div>
                <label className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Choisir un logo
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Centres d&apos;intérêt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {INTEREST_CATEGORIES.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-sm border px-3 py-1.5 text-sm transition ${
                      selectedInterests.includes(interest)
                        ? 'border-[#c9a730] bg-[#fff8e1] text-[#1a237e]'
                        : 'border-gray-200 text-gray-600 hover:border-[#c9a730]/50'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <button
            type="submit"
            disabled={loading}
            className="w-full ygo-btn-blue py-3 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le profil business'}
          </button>
        </form>
      )}
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
