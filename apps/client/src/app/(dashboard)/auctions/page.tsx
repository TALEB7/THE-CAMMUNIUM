'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gavel, Clock, TrendingUp, Plus, Users, Eye } from 'lucide-react';
import { useT } from '@/lib/i18n';

function formatCountdown(endTime: string) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return 'Terminée';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min ${s}s`;
}

function CountdownTimer({ endTime }: { endTime: string }) {
  const [text, setText] = useState(formatCountdown(endTime));

  useEffect(() => {
    const interval = setInterval(() => setText(formatCountdown(endTime)), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const isUrgent = new Date(endTime).getTime() - Date.now() < 3600000;

  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${
        isUrgent ? 'text-red-600' : 'text-gray-600'
      }`}
    >
      <Clock className="h-3 w-3" />
      {text}
    </span>
  );
}

export default function AuctionsPage() {
  const [tab, setTab] = useState<'active' | 'ended' | 'mine' | 'bids'>('active');
  const { t } = useT();

  const { data: activeAuctions, isLoading: loadingActive } = useQuery({
    queryKey: ['auctions-active'],
    queryFn: () => api.get('/auctions').then((r) => r.data),
    enabled: tab === 'active',
    refetchInterval: 10000,
  });

  const { data: endedAuctions, isLoading: loadingEnded } = useQuery({
    queryKey: ['auctions-ended'],
    queryFn: () => api.get('/auctions/ended').then((r) => r.data),
    enabled: tab === 'ended',
  });

  const { data: myAuctions, isLoading: loadingMine } = useQuery({
    queryKey: ['my-auctions'],
    queryFn: () => api.get('/auctions/my/auctions').then((r) => r.data),
    enabled: tab === 'mine',
  });

  const { data: myBids, isLoading: loadingBids } = useQuery({
    queryKey: ['my-bids'],
    queryFn: () => api.get('/auctions/my/bids').then((r) => r.data),
    enabled: tab === 'bids',
  });

  const isLoading =
    (tab === 'active' && loadingActive) ||
    (tab === 'ended' && loadingEnded) ||
    (tab === 'mine' && loadingMine) ||
    (tab === 'bids' && loadingBids);

  const getAuctions = () => {
    switch (tab) {
      case 'active':
        return activeAuctions?.data || [];
      case 'ended':
        return endedAuctions?.data || [];
      case 'mine':
        return myAuctions || [];
      case 'bids':
        return (myBids || []).map((bid: any) => ({ ...bid.auction, myBid: bid }));
      default:
        return [];
    }
  };

  const auctions = getAuctions();

  const tabs = [
    { key: 'active' as const, label: 'En cours', icon: Gavel },
    { key: 'ended' as const, label: 'Terminées', icon: Clock },
    { key: 'mine' as const, label: 'Mes enchères', icon: Users },
    { key: 'bids' as const, label: 'Mes mises', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading tracking-wide">{t.auctionsPage.title}</h1>
          <p className="text-gray-500">{t.auctionsPage.description}</p>
          <div className="ygo-accent-line max-w-[100px] mt-1" />
        </div>
        <Link
          href="/auctions/new"
          className="ygo-btn-gold flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Créer une enchère
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded border border-[#d4c088]/50 bg-[#faf8f0] p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? 'bg-white text-[#1a237e] shadow-sm border border-[#c9a730]/50 font-semibold'
                : 'text-gray-500 hover:text-[#1a237e]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c9a730] border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && auctions.length === 0 && (
        <div className="rounded-xl border bg-white py-20 text-center">
          <div className="text-5xl">🔨</div>
          <p className="mt-4 text-lg font-medium text-gray-900">
            {tab === 'active' && 'Aucune enchère en cours'}
            {tab === 'ended' && 'Aucune enchère terminée'}
            {tab === 'mine' && 'Vous n\'avez pas encore créé d\'enchère'}
            {tab === 'bids' && 'Vous n\'avez pas encore misé'}
          </p>
        </div>
      )}

      {/* Auctions Grid */}
      {!isLoading && auctions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction: any) => (
            <AuctionCard key={auction.id} auction={auction} tab={tab} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuctionCard({ auction, tab }: { auction: any; tab: string }) {
  const listing = auction.listing;
  const hasImage = listing?.images?.length > 0;
  const isActive = auction.status === 'ACTIVE';
  const isEnded = auction.status === 'ENDED';

  return (
    <Link href={`/auctions/${auction.id}`}>
      <Card className="group overflow-hidden transition hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100">
          {hasImage ? (
            <img
              src={listing.images[0]}
              alt={listing?.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-gray-300">
              🔨
            </div>
          )}

          {/* Status Badge */}
          <Badge
            className={`absolute left-2 top-2 ${
              isActive
                ? 'bg-green-500'
                : isEnded
                ? 'bg-gray-500'
                : auction.status === 'SCHEDULED'
                ? 'bg-blue-500'
                : 'bg-red-500'
            }`}
          >
            {isActive ? '🟢 En cours' : isEnded ? '🏁 Terminée' : auction.status}
          </Badge>

          {/* Countdown */}
          {isActive && (
            <div className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 backdrop-blur">
              <CountdownTimer endTime={auction.endTime} />
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-[#1a237e] group-hover:text-[#c9a730]">
            {listing?.title}
          </h3>

          {/* Prices */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">Prix actuel</p>
              <p className="text-lg font-bold text-[#1a237e]">
                {(auction.currentPrice || auction.startingPrice).toLocaleString('fr-MA')} Dhs
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Départ</p>
              <p className="text-sm font-medium text-gray-600">
                {auction.startingPrice.toLocaleString('fr-MA')} Dhs
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {auction.totalBids} mises
            </span>
            {auction.minIncrement && (
              <span>Min +{auction.minIncrement.toLocaleString('fr-MA')} Dhs</span>
            )}
          </div>

          {/* My bid info */}
          {tab === 'bids' && auction.myBid && (
            <div
              className={`rounded-md p-2 text-center text-xs font-medium ${
                auction.myBid.isWinning
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              Votre mise : {auction.myBid.amount.toLocaleString('fr-MA')} Dhs
              {auction.myBid.isWinning ? ' ✅ En tête' : ' ❌ Surenchéri'}
            </div>
          )}

          {/* Winner */}
          {isEnded && auction.winner && (
            <div className="rounded-md bg-amber-50 p-2 text-center text-xs font-medium text-amber-700">
              🏆 Gagné par {auction.winner.firstName} {auction.winner.lastName?.[0]}.
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
