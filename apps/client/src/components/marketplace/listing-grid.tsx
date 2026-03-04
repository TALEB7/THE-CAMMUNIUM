'use client';

import { ListingCard } from './listing-card';

// ==================== Types ====================

interface PaginationMeta {
  totalPages: number;
  total?: number;
}

interface ListingGridProps {
  listings: any[];
  isLoading: boolean;
  meta: PaginationMeta | undefined;
  page: number;
  onPageChange: (page: number) => void;
}

// ==================== Component ====================

export function ListingGrid({
  listings,
  isLoading,
  meta,
  page,
  onPageChange,
}: ListingGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c9a730] border-t-transparent" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border bg-white py-20 text-center">
        <p className="text-lg font-medium text-gray-900">Aucune annonce trouvée</p>
        <p className="mt-1 text-sm text-gray-500">Essayez de modifier vos filtres de recherche</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listings.map((listing: any) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600">
            Page {page} sur {meta.totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
            disabled={page === meta.totalPages}
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </>
  );
}
