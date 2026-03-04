'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Gavel, AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function CreateAuctionPage() {
  const { t } = useT();
  const router = useRouter();
  const { toast } = useToast();

  const [listingId, setListingId] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [minIncrement, setMinIncrement] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // Fetch user's active listings (only those without auctions)
  const { data: myListings, isLoading } = useQuery({
    queryKey: ['my-listings-for-auction'],
    queryFn: () => api.get('/marketplace/my-listings').then((r) => r.data),
  });

  const availableListings = myListings?.filter(
    (l: any) => l.status === 'ACTIVE' && !l.auction,
  ) || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/auctions', data),
    onSuccess: (res) => {
      toast({ title: 'Enchère créée avec succès !' });
      router.push(`/auctions/${res.data.id}`);
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Impossible de créer l\'enchère',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!listingId || !startingPrice || !startDate || !startTime || !endDate || !endTime) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (end <= start) {
      toast({
        title: 'Dates invalides',
        description: 'La date de fin doit être après la date de début.',
        variant: 'destructive',
      });
      return;
    }

    const diffHours = (end.getTime() - start.getTime()) / 3600000;
    if (diffHours < 1) {
      toast({
        title: 'Durée trop courte',
        description: 'L\'enchère doit durer au moins 1 heure.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      listingId,
      startingPrice: parseFloat(startingPrice),
      reservePrice: reservePrice ? parseFloat(reservePrice) : undefined,
      minIncrement: minIncrement ? parseFloat(minIncrement) : undefined,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
  };

  // Set default dates
  const now = new Date();
  const defaultStart = now.toISOString().slice(0, 10);
  const defaultTime = now.toTimeString().slice(0, 5);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/auctions" className="rounded-lg border p-2 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading tracking-wide">Créer une enchère</h1>
          <p className="text-sm text-gray-500">Mettez un de vos articles aux enchères</p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex gap-3 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Informations importantes</p>
            <ul className="mt-1 list-disc pl-4 text-xs">
              <li>Seules vos annonces actives sans enchère existante sont disponibles</li>
              <li>L'enchère dure au minimum 1 heure</li>
              <li>Vous ne pouvez annuler que s'il n'y a aucune mise</li>
              <li>Le prix de réserve est optionnel et reste secret</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Listing */}
        <Card>
          <CardHeader>
            <CardTitle>Article à mettre aux enchères</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#c9a730] border-t-transparent" />
              </div>
            ) : availableListings.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">
                  Aucune annonce active disponible.{' '}
                  <Link href="/marketplace/new" className="text-[#c9a730] hover:underline">
                    Créez-en une d'abord
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableListings.map((l: any) => (
                  <label
                    key={l.id}
                    className={`flex cursor-pointer items-center gap-3 rounded border p-3 transition ${
                      listingId === l.id
                        ? 'border-[#c9a730] bg-[#fff8e1]'
                        : 'hover:bg-[#faf8f0]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="listing"
                      value={l.id}
                      checked={listingId === l.id}
                      onChange={() => setListingId(l.id)}
                      className="accent-[#c9a730]"
                    />
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {l.images?.length > 0 ? (
                        <img src={l.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-lg">📦</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{l.title}</p>
                      <p className="text-xs text-gray-500">
                        Prix de vente : {l.price.toLocaleString('fr-MA')} Dhs
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Prix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Prix de départ (Dhs) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  placeholder="100"
                  min="1"
                  step="1"
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Prix de réserve (Dhs)
                </label>
                <input
                  type="number"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  placeholder="Optionnel"
                  min="1"
                  step="1"
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Prix minimum que vous acceptez (invisible aux enchérisseurs)
                </p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Incrément minimum (Dhs)
              </label>
              <input
                type="number"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                placeholder="10"
                min="1"
                step="1"
                className="w-full rounded-lg border px-4 py-2.5 text-sm sm:w-1/2"
              />
              <p className="mt-1 text-xs text-gray-400">
                Montant minimum au-dessus de la mise actuelle
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader>
            <CardTitle>Programmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={defaultStart}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Heure de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || defaultStart}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Heure de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/auctions"
            className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || !listingId}
            className="ygo-btn-blue flex items-center gap-2 px-6 py-2.5 disabled:opacity-50"
          >
            <Gavel className="h-4 w-4" />
            {createMutation.isPending ? 'Création...' : 'Créer l\'enchère'}
          </button>
        </div>
      </form>
    </div>
  );
}
