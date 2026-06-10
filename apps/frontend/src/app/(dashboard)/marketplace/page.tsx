'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp } from 'lucide-react';
import { MarketplaceSkeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n';
import { useListings, useCategoriesTree } from '@/hooks/marketplace';
import { useQuery } from '@tanstack/react-query';
import { getTrendingCategories } from '@/api/analytics.api';
import { ListingFilters, ListingGrid } from '@/components/marketplace';
import type { ListingFiltersValues } from '@/components/marketplace';

export default function MarketplacePage() {
  const { t } = useT();
  const [filters, setFilters] = useState<ListingFiltersValues>({
    search: '',
    category: '',
    city: '',
    condition: '',
    sort: 'newest',
    minPrice: '',
    maxPrice: '',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useCategoriesTree();
  const { data: trendingData } = useQuery({
    queryKey: ['trending-categories'],
    queryFn: () => getTrendingCategories(7, 8),
    staleTime: 10 * 60 * 1000,
  });

  const { data: listingsData, isLoading } = useListings({
    q: filters.search,
    category: filters.category,
    city: filters.city,
    condition: filters.condition,
    sort: filters.sort,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    page,
  });

  const handleFilterChange = (patch: Partial<ListingFiltersValues>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      city: '',
      condition: '',
      sort: 'newest',
      minPrice: '',
      maxPrice: '',
    });
    setPage(1);
  };

  if (isLoading && !listingsData) return <MarketplaceSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary font-heading tracking-wide">
            {t.marketplacePage.title}
          </h1>
          <p className="text-muted-foreground">{t.marketplacePage.description}</p>
          <div className="ygo-accent-line max-w-[120px] mt-1" />
        </div>
        <Link href="/marketplace/new" className="ygo-btn-gold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Publier une annonce
        </Link>
      </div>

      {/* Trending categories strip */}
      {trendingData && trendingData.trending.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0">
            <TrendingUp className="h-3.5 w-3.5" /> Tendance :
          </span>
          {trendingData.trending.map((cat) => (
            <button
              key={cat.category}
              type="button"
              onClick={() => { handleFilterChange({ category: cat.category }); setPage(1); }}
              className="rounded-full border border-primary/30 bg-accent px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors"
            >
              {cat.category}
              {cat.growth_rate > 0.1 && (
                <span className="ml-1 text-green-600 font-bold">
                  +{Math.round(cat.growth_rate * 100)}%
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <ListingFilters
        values={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
        categories={categories}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
      />

      {/* Grid + Pagination */}
      <ListingGrid
        listings={listingsData?.data || []}
        isLoading={isLoading}
        meta={listingsData?.meta}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
