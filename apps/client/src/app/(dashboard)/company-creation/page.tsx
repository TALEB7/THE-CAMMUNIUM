'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  FileText,
  Landmark,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { LEGAL_FORMS, TAX_REGIMES } from '@communium/shared';

const STEPS = [
  { num: 1, label: 'Forme juridique', icon: Building2, desc: 'Choisissez la forme légale de votre entreprise' },
  { num: 2, label: 'Registre de commerce', icon: FileText, desc: 'Enregistrement RC, ICE et régime fiscal' },
  { num: 3, label: 'Banque & Capital', icon: Landmark, desc: 'Compte bancaire et capital social' },
  { num: 4, label: 'Adresse & Contact', icon: MapPin, desc: 'Siège social et coordonnées' },
];

export default function CompanyCreationPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const { t } = useT();

  // Form state
  const [form, setForm] = useState({
    legalForm: '',
    companyName: '',
    tradeName: '',
    activitySector: '',
    rc: '',
    ice: '',
    identifiantFiscal: '',
    cnss: '',
    taxRegime: '',
    bankName: '',
    capitalAmount: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
  });

  // Fetch existing company creation
  const { data: existing, isLoading: loading } = useQuery({
    queryKey: ['company-creation', userId],
    queryFn: () => api.get(`/company-creation/${userId}/step/1`).then((r) => r.data).catch(() => null),
    enabled: !!userId,
  });

  // Save step mutation
  const saveMutation = useMutation({
    mutationFn: (step: number) => api.patch(`/company-creation/${userId}/step/${step}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-creation'] });
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: () => api.post(`/company-creation/${userId}/submit`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-creation'] }),
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    await saveMutation.mutateAsync(currentStep);
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    await saveMutation.mutateAsync(4);
    submitMutation.mutate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" />
      </div>
    );
  }

  // If already submitted
  if (existing?.status === 'SUBMITTED' || existing?.status === 'APPROVED' || existing?.status === 'REJECTED') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#1a237e] font-heading">{t.companyCreationPage.title}</h1>
        <Card className="border-[#d4c088]/40">
          <CardContent className="p-8 text-center">
            {existing.status === 'SUBMITTED' && (
              <>
                <Loader2 className="h-16 w-16 mx-auto text-[#c9a730] mb-4" />
                <h2 className="text-xl font-bold text-[#1a237e]">Demande en cours d'examen</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Votre dossier de création d'entreprise <strong>{existing.companyName}</strong> est en cours de vérification par notre équipe.
                </p>
                <Badge className="mt-4 bg-yellow-100 text-yellow-800 border-yellow-300">En attente</Badge>
              </>
            )}
            {existing.status === 'APPROVED' && (
              <>
                <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-bold text-green-700">Demande approuvée !</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Votre entreprise <strong>{existing.companyName}</strong> a été validée avec succès.
                </p>
                <Badge className="mt-4 bg-green-100 text-green-800 border-green-300">Approuvée</Badge>
              </>
            )}
            {existing.status === 'REJECTED' && (
              <>
                <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-red-700">Demande rejetée</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Votre demande pour <strong>{existing.companyName}</strong> a été rejetée.
                </p>
                {existing.rejectionReason && (
                  <p className="text-sm text-red-600 mt-2 bg-red-50 rounded-lg p-3">
                    Raison : {existing.rejectionReason}
                  </p>
                )}
                <Badge className="mt-4 bg-red-100 text-red-800 border-red-300">Rejetée</Badge>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a237e] font-heading">{t.companyCreationPage.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t.companyCreationPage.description}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-[#d4c088]/40 p-4">
        {STEPS.map((step, idx) => (
          <div key={step.num} className="flex items-center">
            <button
              onClick={() => step.num <= (existing?.currentStep || currentStep) && setCurrentStep(step.num)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                currentStep === step.num
                  ? 'bg-[#1a237e] text-white'
                  : step.num < currentStep
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-400'
              }`}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-current">
                {step.num < currentStep ? <Check className="h-4 w-4" /> : step.num}
              </div>
              <span className="hidden md:block text-xs font-semibold">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="border-[#d4c088]/40">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            {(() => {
              const StepIcon = STEPS[currentStep - 1].icon;
              return <StepIcon className="h-6 w-6 text-[#c9a730]" />;
            })()}
            <div>
              <h2 className="text-lg font-bold text-[#1a237e]">{STEPS[currentStep - 1].label}</h2>
              <p className="text-xs text-gray-500">{STEPS[currentStep - 1].desc}</p>
            </div>
          </div>

          {/* Step 1: Legal Form */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Forme juridique *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LEGAL_FORMS.map((lf) => (
                    <button
                      key={lf.value}
                      onClick={() => updateField('legalForm', lf.value)}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        form.legalForm === lf.value
                          ? 'border-[#c9a730] bg-[#f5f0e1]'
                          : 'border-gray-200 hover:border-[#d4c088]'
                      }`}
                    >
                      <span className="font-bold text-sm text-[#1a237e]">{lf.label}</span>
                      <p className="text-xs text-gray-500 mt-1">{lf.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Dénomination sociale *</label>
                  <input
                    value={form.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                    placeholder="Nom officiel de l'entreprise"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Nom commercial</label>
                  <input
                    value={form.tradeName}
                    onChange={(e) => updateField('tradeName', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                    placeholder="Nom d'usage"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Secteur d'activité *</label>
                <input
                  value={form.activitySector}
                  onChange={(e) => updateField('activitySector', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                  placeholder="Ex: Commerce, Services, Industrie..."
                />
              </div>
            </div>
          )}

          {/* Step 2: RC / Tax */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Numéro RC</label>
                  <input
                    value={form.rc}
                    onChange={(e) => updateField('rc', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                    placeholder="Registre de commerce"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Numéro ICE</label>
                  <input
                    value={form.ice}
                    onChange={(e) => updateField('ice', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                    placeholder="Identifiant Commun de l'Entreprise"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Identifiant fiscal (IF)</label>
                  <input
                    value={form.identifiantFiscal}
                    onChange={(e) => updateField('identifiantFiscal', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Numéro CNSS</label>
                  <input
                    value={form.cnss}
                    onChange={(e) => updateField('cnss', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Régime fiscal</label>
                <div className="flex gap-3">
                  {TAX_REGIMES.map((tr) => (
                    <button
                      key={tr.value}
                      onClick={() => updateField('taxRegime', tr.value)}
                      className={`px-6 py-3 rounded-lg border-2 transition ${
                        form.taxRegime === tr.value
                          ? 'border-[#c9a730] bg-[#f5f0e1]'
                          : 'border-gray-200 hover:border-[#d4c088]'
                      }`}
                    >
                      <span className="font-bold text-sm text-[#1a237e]">{tr.label}</span>
                      <p className="text-xs text-gray-500">{tr.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Bank & Capital */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Banque *</label>
                <input
                  value={form.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                  placeholder="Ex: Attijariwafa Bank, BMCE, CIH..."
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Capital social (MAD) *</label>
                <input
                  type="number"
                  value={form.capitalAmount}
                  onChange={(e) => updateField('capitalAmount', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                  placeholder="Montant du capital"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum recommandé : 10 000 MAD pour une SARL, 300 000 MAD pour une SA
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Address & Contact */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Adresse du siège social *</label>
                <input
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                  placeholder="Adresse complète"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Ville *</label>
                  <input
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                    placeholder="Casablanca, Rabat..."
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Code postal</label>
                  <input
                    value={form.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Téléphone *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Email professionnel *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                    placeholder="contact@entreprise.ma"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-[#1a237e] disabled:opacity-30 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] disabled:opacity-50 transition"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saveMutation.isPending || submitMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-[#c9a730] text-white rounded-lg hover:bg-[#b8962c] disabled:opacity-50 transition"
              >
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Soumettre la demande
              </button>
            )}
          </div>

          {saveMutation.isError && (
            <p className="text-xs text-red-500 mt-3 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Erreur lors de la sauvegarde. Veuillez réessayer.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
