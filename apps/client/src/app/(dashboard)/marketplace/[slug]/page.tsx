'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n';
import {
  useListingBySlug,
  useListingReviews,
  useToggleFavorite,
  useSubmitReview,
  useBoostListing,
} from '@/hooks/marketplace';
import { ImageGallery, ReviewSection, ListingSidebar } from '@/components/marketplace';

export default function ListingDetailPage() {
  const { t } = useT();
  const params = useParams();
  const { toast } = useToast();
  const slug = params.slug as string;

  // Queries
  const { data: listing, isLoading } = useListingBySlug(slug);
  const { data: reviews } = useListingReviews(listing?.id);

  // Mutations
  const favMutation = useToggleFavorite(slug);
  const reviewMutation = useSubmitReview(listing?.id);
  const boostMutation = useBoostListing({
    invalidateKeys: [['listing', slug]],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c9a730] border-t-transparent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-gray-900">Annonce non trouvée</p>
        <Link href="/marketplace" className="mt-2 text-sm text-[#c9a730] hover:underline">
          Retour au marketplace
        </Link>
      </div>
    );
  }

  const images = listing.images || [];
  const avgRating =
    reviews?.length > 0
      ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/marketplace" className="flex items-center gap-1 hover:text-[#c9a730]">
          <ArrowLeft className="h-4 w-4" />
          Marketplace
        </Link>
        {listing.category && (
          <>
            <span>/</span>
            <span>{listing.category.name}</span>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left - Images & Details */}
        <div className="space-y-4 lg:col-span-2">
          <ImageGallery
            images={images}
            title={listing.title}
            isBoosted={listing.isBoosted}
          />

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{listing.description}</p>
              {listing.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {listing.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <ReviewSection
            reviews={reviews}
            avgRating={avgRating}
            onSubmit={(data, onSuccess) => {
              reviewMutation.mutate(data, { onSuccess });
            }}
            isSubmitting={reviewMutation.isPending}
          />
        </div>

        {/* Right - Price & Seller */}
        <ListingSidebar
          listing={listing}
          onToggleFavorite={(id) => favMutation.mutate(id)}
          onBoost={(id) => boostMutation.mutate(id)}
          onShare={() => {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Lien copié !' });
          }}
          isBoosting={boostMutation.isPending}
        />
      </div>
    </div>
  );
}
