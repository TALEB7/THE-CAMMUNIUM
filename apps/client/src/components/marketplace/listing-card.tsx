'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, MapPin } from 'lucide-react';
import { LISTING_CONDITIONS } from '@communium/shared';

interface ListingCardProps {
  listing: {
    id: string;
    slug: string;
    title: string;
    price: number;
    condition: string;
    city: string | null;
    viewCount: number;
    isBoosted: boolean;
    images: string[];
    auction?: { id: string } | null;
    category?: { name: string } | null;
    seller?: {
      firstName: string | null;
      lastName: string | null;
      isVerified: boolean;
    } | null;
    _count?: { favorites: number };
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const hasImage = listing.images && listing.images.length > 0;

  return (
    <Link href={`/marketplace/${listing.slug}`}>
      <Card className="group overflow-hidden transition hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100">
          {hasImage ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-gray-300">
              📦
            </div>
          )}
          {listing.isBoosted && (
            <Badge className="absolute left-2 top-2 bg-amber-500">⚡ Boosté</Badge>
          )}
          {listing.auction && (
            <Badge className="absolute right-2 top-2 bg-red-500">🔨 Enchère</Badge>
          )}
        </div>

        <CardContent className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-[#1a237e] group-hover:text-[#c9a730]">
            {listing.title}
          </h3>

          <p className="mt-1 text-lg font-bold text-[#1a237e]">
            {listing.price.toLocaleString('fr-MA')} Dhs
          </p>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {listing.city || 'Maroc'}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {listing.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {listing._count?.favorites || 0}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {listing.category?.name}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {LISTING_CONDITIONS[listing.condition] || listing.condition}
            </Badge>
          </div>

          {/* Seller */}
          <div className="mt-2 flex items-center gap-2 border-t pt-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e8eaf6] text-[10px] font-bold text-[#1a237e]">
              {listing.seller?.firstName?.[0]}
            </div>
            <span className="text-xs text-gray-500">
              {listing.seller?.firstName} {listing.seller?.lastName?.[0]}.
            </span>
            {listing.seller?.isVerified && (
              <span className="text-xs text-green-500">✓</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
