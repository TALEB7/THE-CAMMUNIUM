'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Tag,
  Heart,
  Star,
  Users,
  Bookmark,
  Bell,
  X,
  Loader2,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

const TABS = [
  { key: 'listings', label: 'Annonces', icon: Tag },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'saved', label: 'Recherches sauvegardées', icon: Bookmark },
] as const;

export default function SearchPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'listings' | 'users' | 'saved'>('listings');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useT();

  // Categories
  const { data: categories } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: () => api.get('/categories/tree').then((r) => r.data),
  });

  // Global search
  const { data: globalResults, isLoading: globalLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => api.get('/search', { params: { q: query } }).then((r) => r.data),
    enabled: tab !== 'saved' && query.length >= 2,
  });

  // Advanced listing search
  const { data: listingResults, isLoading: listingsLoading } = useQuery({
    queryKey: ['search-listings', { query, category, city, minPrice, maxPrice, sort }],
    queryFn: () =>
      api
        .get('/search/listings', {
          params: {
            q: query || undefined,
            category: category || undefined,
            city: city || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            sort,
          },
        })
        .then((r) => r.data),
    enabled: tab === 'listings',
  });

  // Saved searches
  const { data: savedSearches } = useQuery({
    queryKey: ['saved-searches', userId],
    queryFn: () => api.get('/search/saved', { params: { userId } }).then((r) => r.data),
    enabled: tab === 'saved' && !!userId,
  });

  // Save a search
  const saveMutation = useMutation({
    mutationFn: () =>
      api.post('/search/saved', {
        userId,
        query,
        filters: { category, city, minPrice, maxPrice, sort },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  // Toggle alert on saved search
  const toggleAlertMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/search/saved/${id}/toggle-alert`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  // Delete saved search
  const deleteSavedMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/search/saved/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const listings = listingResults?.data || [];
  const users = globalResults?.users || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a237e] font-heading">
            {t.searchPage.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.searchPage.description}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher des annonces, des personnes, des services..."
          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-[#d4c088]/40 bg-white text-sm focus:outline-none focus:border-[#c9a730] transition"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-16 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#1a237e] rounded-lg transition"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Filters (collapsible) */}
      {showFilters && (
        <Card className="border-[#d4c088]/40">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
              >
                <option value="">Toutes</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Ville</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Casablanca, Rabat..."
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Prix min</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Prix max</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="999999"
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#d4c088]/40 rounded-lg p-1">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                tab === tabItem.key
                  ? 'bg-[#1a237e] text-white'
                  : 'text-gray-500 hover:text-[#1a237e] hover:bg-[#f5f0e1]'
              }`}
            >
              <tabItem.icon className="h-3.5 w-3.5" />
              {tabItem.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {tab === 'listings' && query && (
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#c9a730] border border-[#c9a730] rounded-lg hover:bg-[#f5f0e1] transition"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Sauvegarder la recherche
          </button>
        )}
      </div>

      {/* Content */}
      {tab === 'listings' && (
        <div>
          {listingsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#c9a730]" />
            </div>
          ) : listings.length === 0 ? (
            <Card className="border-[#d4c088]/40">
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Aucun résultat</h3>
                <p className="text-sm text-gray-400 mt-1">Essayez d'élargir vos critères de recherche</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing: any) => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                  <Card className="border-[#d4c088]/40 hover:shadow-lg hover:border-[#c9a730] transition-all cursor-pointer h-full">
                    <CardContent className="p-4">
                      {listing.images?.[0] && (
                        <div className="w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-100">
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-[#1a237e] text-sm line-clamp-2">{listing.title}</h3>
                      <p className="text-lg font-bold text-[#c9a730] mt-1">{listing.price} MAD</p>
                      {listing.city && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {listing.city}
                        </div>
                      )}
                      {listing.category && (
                        <Badge variant="outline" className="mt-2 text-xs border-[#d4c088]">
                          {listing.category.name}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div>
          {globalLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#c9a730]" />
            </div>
          ) : users.length === 0 ? (
            <Card className="border-[#d4c088]/40">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Aucun utilisateur trouvé</h3>
                <p className="text-sm text-gray-400 mt-1">Recherchez par nom ou spécialité</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((user: any) => (
                <Card key={user.id} className="border-[#d4c088]/40 hover:shadow-lg transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a237e] to-[#3949ab] flex items-center justify-center border-2 border-[#c9a730]">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[#ffd700] font-bold text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1a237e] text-sm">{user.firstName} {user.lastName}</h3>
                      {user.profession && <p className="text-xs text-gray-500">{user.profession}</p>}
                      {user.city && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <MapPin className="h-3 w-3" />
                          {user.city}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/profile/${user.id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-[#1a237e] border border-[#1a237e] rounded-lg hover:bg-[#1a237e] hover:text-white transition"
                    >
                      Voir profil
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div className="space-y-3">
          {!savedSearches?.length ? (
            <Card className="border-[#d4c088]/40">
              <CardContent className="p-12 text-center">
                <Bookmark className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Aucune recherche sauvegardée</h3>
                <p className="text-sm text-gray-400 mt-1">Sauvegardez vos recherches pour être alerté des nouvelles annonces</p>
              </CardContent>
            </Card>
          ) : (
            savedSearches.map((s: any) => (
              <Card key={s.id} className="border-[#d4c088]/40">
                <CardContent className="p-4 flex items-center gap-4">
                  <Search className="h-5 w-5 text-[#c9a730]" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1a237e] text-sm">"{s.query}"</h3>
                    {s.filters && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {Object.entries(s.filters)
                          .filter(([, v]) => v)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Sauvegardée le {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleAlertMutation.mutate(s.id)}
                    className={`p-2 rounded-lg transition ${
                      s.alertEnabled ? 'text-[#c9a730] bg-[#f5f0e1]' : 'text-gray-400 hover:text-[#c9a730]'
                    }`}
                    title={s.alertEnabled ? 'Désactiver les alertes' : 'Activer les alertes'}
                  >
                    <Bell className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSavedMutation.mutate(s.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
