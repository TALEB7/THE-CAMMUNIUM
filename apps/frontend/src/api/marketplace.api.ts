import { api } from '@/lib/api';
import type {
  Listing,
  Category,
  ListingReview,
  ListingCondition,
  PaginatedResponse,
} from '@communium/shared';

// ==================== Request / Response Types ====================

export interface ListingsFilters {
  q?: string;
  category?: string;
  city?: string;
  condition?: ListingCondition | '' | string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: number;
  limit?: number;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  condition: string;
  city?: string;
  location?: string;
  images?: string[];
  tags?: string[];
}

export interface SubmitReviewPayload {
  rating: number;
  comment?: string;
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  condition?: string;
  city?: string;
  location?: string;
  images?: string[];
  tags?: string[];
  status?: string;
}

// ==================== Categories ====================

export async function getCategoriesTree(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/categories/tree');
  return data;
}

// ==================== Listings ====================

export async function getListings(
  filters: ListingsFilters,
): Promise<PaginatedResponse<Listing>> {
  const { data } = await api.get<PaginatedResponse<Listing>>(
    '/marketplace/listings',
    {
      params: {
        q: filters.q || undefined,
        category: filters.category || undefined,
        city: filters.city || undefined,
        condition: filters.condition || undefined,
        sort: filters.sort,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        page: filters.page,
        limit: filters.limit ?? 20,
      },
    },
  );
  return data;
}

export async function getListingBySlug(slug: string): Promise<Listing> {
  const { data } = await api.get<Listing>(`/marketplace/listings/slug/${slug}`);
  return data;
}

export async function getMyListings(): Promise<Listing[]> {
  const { data } = await api.get<Listing[]>('/marketplace/my-listings');
  return data;
}

export async function createListing(
  payload: CreateListingPayload,
): Promise<Listing> {
  const { data } = await api.post<Listing>('/marketplace/listings', payload);
  return data;
}

export async function deleteListing(id: string): Promise<void> {
  await api.delete(`/marketplace/listings/${id}`);
}

export async function updateListing(
  id: string,
  payload: UpdateListingPayload,
): Promise<Listing> {
  const { data } = await api.put<Listing>(
    `/marketplace/listings/${id}`,
    payload,
  );
  return data;
}

export async function boostListing(id: string): Promise<void> {
  await api.post(`/marketplace/listings/${id}/boost`);
}

export async function toggleFavorite(listingId: string): Promise<void> {
  await api.post(`/marketplace/listings/${listingId}/favorite`);
}

// ==================== AI — Similar Listings ====================

export async function getSimilarListings(listingId: string): Promise<Listing[]> {
  const { data } = await api.get<Listing[]>(
    `/marketplace/listings/${listingId}/similar`,
    { params: { limit: 5 } },
  );
  return data;
}

// ==================== AI — Price Suggestion ====================

export interface PriceSuggestion {
  min_price: number;
  max_price: number;
  recommended_price: number;
  confidence: number;
  method: string;
}

export async function suggestPrice(
  categoryId: string,
  condition: string,
): Promise<PriceSuggestion> {
  const { data } = await api.get<PriceSuggestion>(
    '/marketplace/listings/price-suggestion',
    { params: { categoryId, condition } },
  );
  return data;
}

// ==================== AI — NLP Auto-classify ====================

export interface ClassifyResult {
  predicted_category: string;
  confidence: number;
  suggested_tags: string[];
  urgency: string;
}

export async function classifyListing(
  title: string,
  description: string,
): Promise<ClassifyResult> {
  const { data } = await api.get<ClassifyResult>(
    '/marketplace/listings/classify',
    { params: { title, description } },
  );
  return data;
}

// ==================== AI — ETA Prediction ====================

export interface EtaResult {
  eta_minutes: number;
  eta_hours: number;
  eta_days: number;
  confidence: number;
  breakdown: {
    base_hours: number;
    category: string;
    location_zone: string;
    condition_factor: string;
    seller_experience: string;
    timing: string;
  };
}

export async function getListingEta(
  listingId: string,
  buyerCity?: string,
): Promise<EtaResult> {
  const { data } = await api.get<EtaResult>(
    `/marketplace/listings/${listingId}/eta`,
    { params: buyerCity ? { buyerCity } : {} },
  );
  return data;
}

// ==================== AI — Sentiment Analysis ====================

export interface SentimentResult {
  results: Array<{ text: string; label: string; score: number; compound: number }>;
  avg_compound: number;
}

export async function getListingReviewSentiment(
  listingId: string,
): Promise<SentimentResult> {
  const { data } = await api.get<SentimentResult>(
    `/marketplace/listings/${listingId}/sentiment`,
  );
  return data;
}

// ==================== Reviews ====================

export async function getListingReviews(
  listingId: string,
): Promise<ListingReview[]> {
  const { data } = await api.get<ListingReview[]>(
    `/marketplace/listings/${listingId}/reviews`,
  );
  return data;
}

export async function submitReview(
  listingId: string,
  payload: SubmitReviewPayload,
): Promise<ListingReview> {
  const { data } = await api.post<ListingReview>(
    `/marketplace/listings/${listingId}/reviews`,
    payload,
  );
  return data;
}
