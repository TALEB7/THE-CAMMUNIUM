'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Gavel,
  User,
  Calendar,
  AlertTriangle,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { getMediaUrl } from '@/lib/media-url';

function useCountdown(endTime: string) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(endTime).getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(endTime).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const d = Math.floor(remaining / 86400000);
  const h = Math.floor((remaining % 86400000) / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);

  return { d, h, m, s, isEnded: remaining === 0, isUrgent: remaining < 3600000 };
}

export default function AuctionDetailPage() {
  const { t } = useT();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const auctionId = params.id as string;

  const [bidAmount, setBidAmount] = useState('');

  // Fetch auction
  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', auctionId],
    queryFn: () => api.get(`/auctions/${auctionId}`).then((r) => r.data),
    enabled: !!auctionId,
    refetchInterval: 5000,
  });

  const countdown = useCountdown(auction?.endTime || new Date().toISOString());

  // Place bid
  const bidMutation = useMutation({
    mutationFn: (amount: number) =>
      api.post(`/auctions/${auctionId}/bid`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      setBidAmount('');
      toast({ title: 'Mise placée avec succès !' });
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Impossible de placer la mise',
        variant: 'destructive',
      });
    },
  });

  // Cancel auction
  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/auctions/${auctionId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      toast({ title: 'Enchère annulée' });
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Impossible d\'annuler',
        variant: 'destructive',
      });
    },
  });

  const handleBid = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Montant invalide', variant: 'destructive' });
      return;
    }
    bidMutation.mutate(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium">Enchère non trouvée</p>
        <Link href="/auctions" className="mt-2 text-sm text-primary hover:underline">
          Retour aux enchères
        </Link>
      </div>
    );
  }

  const listing = auction.listing;
  const isActive = auction.status === 'ACTIVE';
  const isEnded = auction.status === 'ENDED';
  const isCanceled = auction.status === 'CANCELED';
  const minBid = (auction.currentPrice || auction.startingPrice) + (auction.minIncrement || 1);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <Link href="/auctions" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        Retour aux enchères
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left - Listing Info & Bid History */}
        <div className="space-y-4 lg:col-span-2">
          {/* Listing Card */}
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/9] bg-muted">
              {listing?.images?.length > 0 ? (
                <img
                  src={getMediaUrl(listing.images[0]) || listing.images[0]}
                  alt={listing.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl text-muted-foreground/50">
                  🔨
                </div>
              )}
              <Badge
                className={`absolute left-3 top-3 ${
                  isActive ? 'bg-green-500 text-white' : isEnded ? 'bg-muted text-muted-foreground' : isCanceled ? 'bg-destructive text-destructive-foreground' : 'bg-blue-500 text-white'
                }`}
              >
                {isActive ? '🟢 En cours' : isEnded ? '🏁 Terminée' : isCanceled ? '❌ Annulée' : '📅 Programmée'}
              </Badge>
            </div>
            <CardContent className="p-5">
              <h1 className="text-xl font-extrabold text-primary font-heading">{listing?.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{listing?.description}</p>
              <Link
                href={`/marketplace/${listing?.slug}`}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Voir l'annonce complète →
              </Link>
            </CardContent>
          </Card>

          {/* Bid History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Historique des mises ({auction.totalBids})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auction.bids?.length > 0 ? (
                <div className="space-y-2">
                  {auction.bids.map((bid: any, idx: number) => (
                    <div
                      key={bid.id}
                      className={`flex items-center justify-between rounded-lg p-3 ${
                        idx === 0 ? 'bg-green-50 border border-green-200' : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0
                              ? 'bg-green-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {idx === 0 ? '👑' : `#${idx + 1}`}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {bid.bidder?.firstName} {bid.bidder?.lastName?.[0]}.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(bid.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${idx === 0 ? 'text-green-600' : 'text-foreground/80'}`}>
                        {bid.amount.toLocaleString('fr-MA')} Dhs
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucune mise pour le moment. Soyez le premier !
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Bidding & Info */}
        <div className="space-y-4">
          {/* Countdown */}
          {isActive && (
            <Card className={countdown.isUrgent ? 'border-red-300 bg-destructive/10' : 'border-primary/40 bg-accent'}>
              <CardContent className="p-5">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Temps restant</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Jours', value: countdown.d },
                    { label: 'Heures', value: countdown.h },
                    { label: 'Min', value: countdown.m },
                    { label: 'Sec', value: countdown.s },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-2xl font-bold ${countdown.isUrgent ? 'text-red-600' : 'text-primary'}`}>
                        {String(value).padStart(2, '0')}
                      </p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Price */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Prix actuel</p>
                <p className="text-3xl font-bold text-primary font-heading">
                  {(auction.currentPrice || auction.startingPrice).toLocaleString('fr-MA')} Dhs
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Prix de départ</p>
                  <p className="font-semibold">{auction.startingPrice.toLocaleString('fr-MA')} Dhs</p>
                </div>
                {auction.reservePrice && (
                  <div>
                    <p className="text-muted-foreground">Prix de réserve</p>
                    <p className="font-semibold">
                      {(auction.currentPrice || 0) >= auction.reservePrice
                        ? '✅ Atteint'
                        : '⚠️ Non atteint'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Mise minimum</p>
                  <p className="font-semibold">+{(auction.minIncrement || 1).toLocaleString('fr-MA')} Dhs</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total des mises</p>
                  <p className="font-semibold">{auction.totalBids}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Début : {new Date(auction.startTime).toLocaleString('fr-FR')}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Fin : {new Date(auction.endTime).toLocaleString('fr-FR')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Place Bid */}
          {isActive && !countdown.isEnded && (
            <Card className="border-primary/40">
              <CardContent className="p-5">
                <h3 className="mb-3 font-semibold text-foreground">Placer une mise</h3>
                <form onSubmit={handleBid} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Montant minimum : {minBid.toLocaleString('fr-MA')} Dhs
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`${minBid}`}
                        min={minBid}
                        step="1"
                        className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium"
                        required
                      />
                      <span className="text-sm font-medium text-muted-foreground">Dhs</span>
                    </div>
                  </div>

                  {/* Quick bid buttons */}
                  <div className="flex gap-2">
                    {[0, 50, 100, 500].map((extra) => {
                      const val = minBid + extra;
                      return (
                        <button
                          key={extra}
                          type="button"
                          onClick={() => setBidAmount(String(val))}
                          className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                          {extra === 0 ? 'Min' : `+${extra}`}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    disabled={bidMutation.isPending}
                    className="flex w-full items-center justify-center gap-2 ygo-btn-gold py-2.5 disabled:opacity-50"
                  >
                    <Gavel className="h-4 w-4" />
                    {bidMutation.isPending ? 'Mise en cours...' : 'Miser'}
                  </button>

                  <p className="text-center text-xs text-muted-foreground">
                    ⚠️ Les mises sont définitives et ne peuvent pas être annulées
                  </p>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Winner Card */}
          {isEnded && auction.winner && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="p-5 text-center">
                <Trophy className="mx-auto h-10 w-10 text-amber-500" />
                <h3 className="mt-2 text-lg font-bold text-amber-800">Enchère terminée</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Remportée par <strong>{auction.winner.firstName} {auction.winner.lastName}</strong>
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-800">
                  {auction.currentPrice.toLocaleString('fr-MA')} Dhs
                </p>
              </CardContent>
            </Card>
          )}

          {/* Canceled */}
          {isCanceled && (
            <Card className="border-red-200 bg-destructive/10">
              <CardContent className="flex items-center gap-3 p-5">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-800">Enchère annulée</h3>
                  <p className="text-xs text-red-600">Cette enchère a été annulée par le vendeur.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seller Info */}
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Vendeur</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary border-2 border-primary">
                  {listing?.seller?.firstName?.[0]}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {listing?.seller?.firstName} {listing?.seller?.lastName}
                  </p>
                  {listing?.seller?.isVerified && (
                    <span className="text-xs text-green-500">✓ Vérifié</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
