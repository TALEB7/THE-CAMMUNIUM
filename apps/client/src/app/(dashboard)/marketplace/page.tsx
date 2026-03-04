'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useListings, useCategoriesTree } from '@/hooks/marketplace';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading tracking-wide">
            {t.marketplacePage.title}
          </h1>
          <p className="text-gray-500">{t.marketplacePage.description}</p>
          <div className="ygo-accent-line max-w-[120px] mt-1" />
        </div>
        <Link href="/marketplace/new" className="ygo-btn-gold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Publier une annonce
        </Link>
      </div>

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
