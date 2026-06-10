'use client';

import { ListingCard } from './listing-card';

interface SimilarListingsSectionProps {
  listingId: string | undefined;
  isLoading: boolean;
  listings: any[];
}

export function SimilarListingsSection({
  listingId,
  isLoading,
  listings,
}: SimilarListingsSectionProps) {
  if (!listingId) return null;
  if (!isLoading && listings.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Annonces similaires
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </section>
  );
}
