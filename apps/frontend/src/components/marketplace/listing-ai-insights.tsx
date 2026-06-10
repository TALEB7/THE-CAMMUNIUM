'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, TrendingUp, MessageSquare } from 'lucide-react';
import type { EtaResult, SentimentResult } from '@/api/marketplace.api';

// ==================== ETA Card ====================

interface EtaCardProps {
  eta: EtaResult | undefined;
  isLoading: boolean;
}

export function ListingEtaCard({ eta, isLoading }: EtaCardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (!eta) return null;

  const label =
    eta.eta_days === 0
      ? 'Aujourd\'hui'
      : eta.eta_days === 1
      ? '24 – 48 heures'
      : `${eta.eta_days} jours environ`;

  const confidencePct = Math.round(eta.confidence * 100);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <div>
        <p className="font-medium text-blue-800">Livraison estimée : {label}</p>
        <p className="text-xs text-blue-600 mt-0.5">
          Fiabilité {confidencePct}% · basé sur la ville, catégorie et état
        </p>
      </div>
    </div>
  );
}

// ==================== Sentiment Summary Card ====================

interface SentimentCardProps {
  sentiment: SentimentResult | undefined;
  isLoading: boolean;
  reviewCount: number;
}

function sentimentLabel(avg: number) {
  if (avg >= 0.15) return { text: 'Avis très positifs', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '😊' };
  if (avg >= 0.05) return { text: 'Avis plutôt positifs', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: '🙂' };
  if (avg >= -0.05) return { text: 'Avis neutres', color: 'text-muted-foreground', bg: 'bg-muted/30 border-border', icon: '😐' };
  if (avg >= -0.15) return { text: 'Avis plutôt négatifs', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '😕' };
  return { text: 'Avis très négatifs', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: '😞' };
}

export function ListingSentimentCard({ sentiment, isLoading, reviewCount }: SentimentCardProps) {
  if (reviewCount === 0) return null;
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (!sentiment || sentiment.results.length === 0) return null;

  const { text, color, bg, icon } = sentimentLabel(sentiment.avg_compound);
  const positive = sentiment.results.filter((r) => r.label === 'positive').length;
  const negative = sentiment.results.filter((r) => r.label === 'negative').length;
  const total = sentiment.results.length;

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${bg}`}>
      <MessageSquare className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
      <div>
        <p className={`font-medium ${color}`}>
          {icon} {text}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {positive} positif{positive !== 1 ? 's' : ''} · {negative} négatif{negative !== 1 ? 's' : ''} sur {total} avis analysés
        </p>
      </div>
    </div>
  );
}

// ==================== Combined AI Insights Block ====================

interface AiInsightsProps {
  eta: EtaResult | undefined;
  etaLoading: boolean;
  sentiment: SentimentResult | undefined;
  sentimentLoading: boolean;
  reviewCount: number;
}

export function ListingAiInsights({ eta, etaLoading, sentiment, sentimentLoading, reviewCount }: AiInsightsProps) {
  const showEta = etaLoading || !!eta;
  const showSentiment = sentimentLoading || (!!sentiment && reviewCount > 0);
  if (!showEta && !showSentiment) return null;

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Insights IA
          </span>
        </div>
        <ListingEtaCard eta={eta} isLoading={etaLoading} />
        <ListingSentimentCard sentiment={sentiment} isLoading={sentimentLoading} reviewCount={reviewCount} />
      </CardContent>
    </Card>
  );
}
