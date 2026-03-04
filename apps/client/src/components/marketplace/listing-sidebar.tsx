'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Share2,
  MapPin,
  Eye,
  Calendar,
  Zap,
  MessageCircle,
} from 'lucide-react';
import { LISTING_CONDITIONS } from '@communium/shared';

// ==================== Types ====================

interface ListingSidebarProps {
  listing: any;
  onToggleFavorite: (id: string) => void;
  onBoost: (id: string) => void;
  onShare: () => void;
  isBoosting: boolean;
}

// ==================== Component ====================

export function ListingSidebar({
  listing,
  onToggleFavorite,
  onBoost,
  onShare,
  isBoosting,
}: ListingSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Price Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1a237e] font-heading">
              {listing.price.toLocaleString('fr-MA')} Dhs
            </h2>
            <button
              onClick={() => onToggleFavorite(listing.id)}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <Heart className="h-5 w-5 text-gray-400 hover:text-red-500" />
            </button>
          </div>

          <h1 className="mt-2 text-lg font-semibold text-gray-900">{listing.title}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{listing.category?.name}</Badge>
            <Badge variant="outline">
              {LISTING_CONDITIONS[listing.condition] || listing.condition}
            </Badge>
            <Badge variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {listing.status}
            </Badge>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-500">
            {listing.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {listing.city}
                {listing.location ? `, ${listing.location}` : ''}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {listing.viewCount} vues
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Publié le {new Date(listing.createdAt).toLocaleDateString('fr-FR')}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            <button className="flex w-full items-center justify-center gap-2 ygo-btn-blue py-2.5">
              <MessageCircle className="h-4 w-4" />
              Contacter le vendeur
            </button>
            <button
              onClick={onShare}
              className="flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Seller Card */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Vendeur</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8eaf6] text-lg font-bold text-[#1a237e] border-2 border-[#c9a730]">
              {listing.seller?.firstName?.[0]}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {listing.seller?.firstName} {listing.seller?.lastName}
                {listing.seller?.isVerified && (
                  <span className="ml-1 text-green-500">✓</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                Membre depuis{' '}
                {new Date(listing.seller?.createdAt).toLocaleDateString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <Link
            href={`/profiles/${listing.seller?.id}`}
            className="mt-3 block text-center text-sm font-medium text-[#c9a730] hover:underline"
          >
            Voir le profil
          </Link>
        </CardContent>
      </Card>

      {/* Boost Card */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-amber-800">Booster cette annonce</h3>
          </div>
          <p className="mt-1 text-xs text-amber-700">
            Mettez votre annonce en avant pendant 7 jours pour seulement 10 Tks
          </p>
          <button
            onClick={() => onBoost(listing.id)}
            disabled={listing.isBoosted || isBoosting}
            className="mt-3 w-full rounded-lg bg-amber-500 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {listing.isBoosted ? 'Déjà boosté' : '⚡ Booster (10 Tks)'}
          </button>
        </CardContent>
      </Card>

      {/* Auction info */}
      {listing.auction && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-5">
            <h3 className="font-semibold text-red-800">🔨 Enchère en cours</h3>
            <p className="mt-1 text-sm text-red-700">
              Prix actuel :{' '}
              <span className="font-bold">
                {listing.auction.currentPrice.toLocaleString('fr-MA')} Dhs
              </span>
            </p>
            <Link
              href={`/auctions/${listing.auction.id}`}
              className="mt-3 block w-full rounded-lg bg-red-500 py-2 text-center text-sm font-medium text-white hover:bg-red-600"
            >
              Voir l'enchère
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
