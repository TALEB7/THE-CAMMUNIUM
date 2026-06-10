'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Coins } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function MembershipPage() {
  const { t } = useT();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cmi'>('cmi');

  const PLANS = [
    {
      id: 'personal_premium',
      name: t.membership.personalPremium,
      price: 0,
      priceLabel: '0 $/an',
      description: t.membership.personalPremiumDesc,
      features: [
        t.membership.verifiedProfile,
        t.membership.unlimitedConnections,
        t.membership.fullMarketplace,
        t.membership.advancedMessaging,
        t.membership.tks50,
        t.membership.emailSupport,
      ],
      accountType: 'personal',
    },
    {
      id: 'business_premium',
      name: t.membership.businessPremium,
      price: 4,
      priceLabel: '4 $/an',
      description: t.membership.businessPremiumDesc,
      features: [
        t.membership.companyPage,
        t.membership.analyticsStats,
        t.membership.priorityMarketplace,
        t.membership.jobPostings,
        t.membership.tks150,
        t.membership.moroccanBilling,
        t.membership.prioritySupport,
      ],
      accountType: 'business',
      highlighted: true,
    },
    {
      id: 'company_creation',
      name: t.membership.companyCreation,
      price: 37,
      priceLabel: '37 $',
      description: t.membership.companyCreationDesc,
      features: [
        t.membership.fullLegalCreation,
        t.membership.domiciliation,
        t.membership.rcIceIf,
        t.membership.businessPremium1yr,
        t.membership.tks500,
        t.membership.dedicatedSupport12m,
      ],
      accountType: 'business',
    },
  ];

  const { data: currentMembership } = useQuery({
    queryKey: ['membership'],
    queryFn: () => api.get('/payments/membership').then((r) => r.data),
  });

  const subscribeMutation = useMutation({
    mutationFn: (data: { planId: string; paymentMethod: string }) =>
      api.post('/payments/subscribe', data),
    onSuccess: (response) => {
      // Redirect to payment page
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    },
  });

  const handleSubscribe = () => {
    if (!selectedPlan) return;
    subscribeMutation.mutate({ planId: selectedPlan, paymentMethod });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary font-heading tracking-wide">{t.membership.title}</h1>
        <p className="text-muted-foreground">{t.membership.description}</p>
        <div className="ygo-accent-line max-w-[120px] mt-1" />
      </div>

      {/* Current Plan */}
      {currentMembership && (
        <Card className="border-primary/40 bg-accent">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">{t.membership.currentPlan}</p>
              <p className="text-lg font-bold text-primary">{currentMembership.planName}</p>
              <p className="text-sm text-muted-foreground">
                {t.membership.expiresOn} {new Date(currentMembership.expiresAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">{t.common.active}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition ${
              selectedPlan === plan.id
                ? 'border-primary ring-2 ring-[#C8102E]/30'
                : plan.highlighted
                  ? 'border-primary/50 shadow-md'
                  : ''
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.highlighted && (
              <div className="rounded-t-lg bg-gradient-to-r from-[#C8102E] to-[#E8233E] px-4 py-1 text-center text-xs font-bold text-primary">
                {t.membership.mostPopular}
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-2 text-3xl font-bold text-primary font-heading">{plan.priceLabel}</p>
              <p className="text-xs text-muted-foreground">{t.membership.vatIncluded}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 text-primary text-sm">★</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Method */}
      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle>{t.membership.paymentMethod}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setPaymentMethod('cmi')}
                className={`flex items-center gap-3 rounded border-2 p-4 transition ${
                  paymentMethod === 'cmi'
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CreditCard className="h-6 w-6 text-morocco-red" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{t.membership.cmi}</p>
                  <p className="text-xs text-muted-foreground">{t.membership.cmiDesc}</p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`flex items-center gap-3 rounded border-2 p-4 transition ${
                  paymentMethod === 'stripe'
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CreditCard className="h-6 w-6 text-indigo-600" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{t.membership.stripe}</p>
                  <p className="text-xs text-muted-foreground">{t.membership.stripeDesc}</p>
                </div>
              </button>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={subscribeMutation.isPending}
              className="w-full ygo-btn-gold py-3 disabled:opacity-50"
            >
              {subscribeMutation.isPending
                ? t.membership.redirecting
                : `${t.membership.subscribe} — ${PLANS.find((p) => p.id === selectedPlan)?.priceLabel}`}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Tks Token Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            {t.membership.tksSystem}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {t.membership.tksSystemDesc}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium text-foreground">{t.membership.earnTks}</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• {t.tokens.completeProfile100} : +20 {t.common.Tks}</li>
                <li>• {t.tokens.dailyLogin} : +2 {t.common.Tks}</li>
                <li>• {t.tokens.referMember} : +25 {t.common.Tks}</li>
                <li>• {t.tokens.firstSale} : +15 {t.common.Tks}</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-foreground">{t.membership.useTks}</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• {t.tokens.boostListing} : 10 {t.common.Tks}</li>
                <li>• {t.tokens.premiumContent} : 5 {t.common.Tks}</li>
                <li>• {t.tokens.boostProfile} : 15 {t.common.Tks}</li>
                <li>• {t.tokens.auction} : {t.tokens.variable}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
