'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BellOff,
  TrendingDown,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function AlertsPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useT();

  // Fetch user's price alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['price-alerts', userId],
    queryFn: () => api.get('/search/alerts', { params: { userId } }).then((r) => r.data),
    enabled: !!userId,
  });

  // Delete alert
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/search/alerts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['price-alerts'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a237e] font-heading">
          {t.alertsPage.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t.alertsPage.description}
        </p>
      </div>

      {/* Info card */}
      <Card className="border-[#d4c088]/40 bg-[#faf8f0]">
        <CardContent className="p-4 flex items-start gap-3">
          <TrendingDown className="h-5 w-5 text-[#c9a730] mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-[#1a237e]">Comment ça marche ?</h3>
            <p className="text-xs text-gray-500 mt-1">
              Depuis une annonce sur le marketplace, définissez un prix cible. Vous serez notifié
              automatiquement lorsque le vendeur baisse son prix en dessous de votre seuil.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {!alerts?.length ? (
        <Card className="border-[#d4c088]/40">
          <CardContent className="p-12 text-center">
            <BellOff className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">Aucune alerte de prix</h3>
            <p className="text-sm text-gray-400 mt-1">
              Parcourez le{' '}
              <Link href="/marketplace" className="text-[#c9a730] underline">
                marketplace
              </Link>{' '}
              et créez des alertes sur les annonces qui vous intéressent
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <Card
              key={alert.id}
              className={`border-[#d4c088]/40 ${alert.isTriggered ? 'bg-green-50 border-green-200' : ''}`}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* Status icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    alert.isTriggered
                      ? 'bg-green-100 text-green-600'
                      : 'bg-[#f5f0e1] text-[#c9a730]'
                  }`}
                >
                  {alert.isTriggered ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                </div>

                {/* Listing info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/marketplace/${alert.listing?.id || alert.listingId}`}
                    className="font-semibold text-sm text-[#1a237e] hover:underline line-clamp-1"
                  >
                    {alert.listing?.title || 'Annonce'}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      Prix actuel :{' '}
                      <span className="font-semibold text-gray-700">
                        {alert.listing?.price?.toLocaleString('fr-FR')} MAD
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">
                      Votre cible :{' '}
                      <span className="font-semibold text-[#c9a730]">
                        {alert.targetPrice?.toLocaleString('fr-FR')} MAD
                      </span>
                    </span>
                  </div>
                  {alert.listing?.city && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" />
                      {alert.listing.city}
                    </div>
                  )}
                </div>

                {/* Status badge */}
                {alert.isTriggered ? (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    Prix atteint !
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-[#d4c088] text-[#c9a730]">
                    En attente
                  </Badge>
                )}

                {/* Delete */}
                <button
                  onClick={() => deleteMutation.mutate(alert.id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {alerts?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-[#d4c088]/40">
            <CardContent className="p-4 text-center">
              <Bell className="h-6 w-6 mx-auto text-[#c9a730] mb-2" />
              <p className="text-2xl font-bold text-[#1a237e]">{alerts.length}</p>
              <p className="text-xs text-gray-500">Alertes actives</p>
            </CardContent>
          </Card>
          <Card className="border-[#d4c088]/40">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {alerts.filter((a: any) => a.isTriggered).length}
              </p>
              <p className="text-xs text-gray-500">Prix atteints</p>
            </CardContent>
          </Card>
          <Card className="border-[#d4c088]/40">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-orange-600">
                {alerts.filter((a: any) => !a.isTriggered).length}
              </p>
              <p className="text-xs text-gray-500">En cours de surveillance</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
