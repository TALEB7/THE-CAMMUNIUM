'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { LISTING_CONDITIONS, MARKETPLACE_SORT_OPTIONS, CITIES } from '@communium/shared';

// ==================== Types ====================

export interface ListingFiltersValues {
  search: string;
  category: string;
  city: string;
  condition: string;  // compatible with ListingCondition | ''
  sort: string;
  minPrice: string;
  maxPrice: string;
}

interface ListingFiltersProps {
  values: ListingFiltersValues;
  onChange: (patch: Partial<ListingFiltersValues>) => void;
  onClear: () => void;
  categories: any[] | undefined;
  showFilters: boolean;
  onToggleFilters: () => void;
}

// ==================== Component ====================

export function ListingFilters({
  values,
  onChange,
  onClear,
  categories,
  showFilters,
  onToggleFilters,
}: ListingFiltersProps) {
  const { search, category, city, condition, sort, minPrice, maxPrice } = values;
  const hasActiveFilters = !!(category || city || condition || minPrice || maxPrice);

  return (
    <div className="space-y-4">
      {/* Search bar + toggle */}
      <div className="flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded border border-[#d4c088]/50 bg-white px-4 py-2.5 focus-within:border-[#c9a730] transition">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Rechercher des annonces..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => onChange({ search: '' })}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 rounded border px-4 py-2.5 text-sm font-medium transition ${
            showFilters
              ? 'border-[#c9a730] bg-[#fff8e1] text-[#1a237e]'
              : 'bg-white text-gray-700 hover:border-[#c9a730]/50 border-[#d4c088]/50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c9a730] text-xs text-white">
              !
            </span>
          )}
        </button>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <Card>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Category */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Catégorie</label>
              <select
                value={category}
                onChange={(e) => onChange({ category: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Toutes</option>
                {categories?.map((cat: any) => (
                  <optgroup key={cat.id} label={`${cat.icon || ''} ${cat.name}`}>
                    <option value={cat.slug}>{cat.name} (Tout)</option>
                    {cat.children?.map((child: any) => (
                      <option key={child.id} value={child.slug}>
                        {child.icon || ''} {child.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Ville</label>
              <select
                value={city}
                onChange={(e) => onChange({ city: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Toutes les villes</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">État</label>
              <select
                value={condition}
                onChange={(e) => onChange({ condition: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                {Object.entries(LISTING_CONDITIONS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Prix min (Dhs)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => onChange({ minPrice: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Prix max (Dhs)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => onChange({ maxPrice: e.target.value })}
                placeholder="∞"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <div className="flex items-end sm:col-span-2 lg:col-span-5">
                <button
                  onClick={onClear}
                  className="text-sm font-medium text-[#c9a730] hover:underline"
                >
                  Effacer tous les filtres
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category chips + Sort */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() =>
                onChange({ category: category === cat.slug ? '' : cat.slug })
              }
              className={`rounded-sm px-3 py-1.5 text-xs font-medium transition border ${
                category === cat.slug
                  ? 'bg-[#1a237e] text-[#ffd700] border-[#c9a730]'
                  : 'bg-white border-[#d4c088]/50 text-gray-600 hover:border-[#c9a730]'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="rounded-lg border bg-white px-3 py-1.5 text-sm"
        >
          {MARKETPLACE_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
