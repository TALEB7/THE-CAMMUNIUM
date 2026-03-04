'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Eye,
  Heart,
  Edit,
  Trash2,
  Zap,
  MoreVertical,
  MapPin,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { LISTING_STATUS_BADGES } from '@communium/shared';
import { useMyListings, useDeleteListing, useBoostListing } from '@/hooks/marketplace';

export default function MyListingsPage() {
  const { t } = useT();

  const { data: listings, isLoading } = useMyListings();
  const deleteMutation = useDeleteListing();
  const boostMutation = useBoostListing();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c9a730] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading tracking-wide">Mes annonces</h1>
          <p className="text-gray-500">{listings?.length || 0} annonces</p>
        </div>
        <Link
          href="/marketplace/new"
          className="ygo-btn-gold flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle annonce
        </Link>
      </div>

      {/* Empty State */}
      {(!listings || listings.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl">📦</div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune annonce</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez à vendre en publiant votre première annonce
            </p>
            <Link
              href="/marketplace/new"
              className="mt-4 ygo-btn-gold"
            >
              Créer une annonce
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Listings */}
      <div className="space-y-3">
        {listings?.map((listing: any) => {
          const statusInfo = LISTING_STATUS_BADGES[listing.status] || LISTING_STATUS_BADGES.DRAFT;
          const hasImage = listing.images?.length > 0;

          return (
            <Card key={listing.id} className="overflow-hidden">
              <CardContent className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {hasImage ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-gray-300">
                      📦
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <Link
                        href={`/marketplace/${listing.slug}`}
                        className="font-semibold text-[#1a237e] hover:text-[#c9a730]"
                      >
                        {listing.title}
                      </Link>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <p className="mt-0.5 text-lg font-bold text-[#1a237e]">
                      {listing.price.toLocaleString('fr-MA')} Dhs
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {listing.viewCount} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {listing._count?.favorites || 0} favoris
                      </span>
                      {listing.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.city}
                        </span>
                      )}
                      {listing.isBoosted && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">⚡ Boosté</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!listing.isBoosted && listing.status === 'ACTIVE' && (
                        <button
                          onClick={() => boostMutation.mutate(listing.id)}
                          disabled={boostMutation.isPending}
                          className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                          title="Boost (10 Tks)"
                        >
                          <Zap className="h-3 w-3" />
                        </button>
                      )}
                      <Link
                        href={`/marketplace/${listing.slug}/edit`}
                        className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        title="Modifier"
                      >
                        <Edit className="h-3 w-3" />
                      </Link>
                      <Link
                        href={`/marketplace/${listing.slug}`}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <Eye className="h-3 w-3" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cette annonce ?')) {
                            deleteMutation.mutate(listing.id);
                          }
                        }}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
