import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getListings,
  getListingBySlug,
  getMyListings,
  getSimilarListings,
  suggestPrice,
  classifyListing,
  getListingEta,
  getListingReviewSentiment,
  createListing,
  updateListing,
  deleteListing,
  boostListing,
  toggleFavorite,
  getListingReviews,
  submitReview,
  type ListingsFilters,
  type CreateListingPayload,
  type UpdateListingPayload,
  type SubmitReviewPayload,
} from '@/api/marketplace.api';

// ==================== Queries ====================

/** Fetch paginated listings with filters. */
export function useListings(filters: ListingsFilters) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => getListings(filters),
  });
}

/** Fetch a single listing by its slug. */
export function useListingBySlug(slug: string) {
  return useQuery({
    queryKey: ['listing', slug],
    queryFn: () => getListingBySlug(slug),
    enabled: !!slug,
  });
}

/** Fetch the current user's own listings. */
export function useMyListings() {
  return useQuery({
    queryKey: ['my-listings'],
    queryFn: getMyListings,
  });
}

/** Fetch reviews for a specific listing. */
export function useListingReviews(listingId: string | undefined) {
  return useQuery({
    queryKey: ['listing-reviews', listingId],
    queryFn: () => getListingReviews(listingId!),
    enabled: !!listingId,
  });
}

// ==================== Mutations ====================

/** Create a new marketplace listing. Returns the created listing. */
export function useCreateListing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateListingPayload) => createListing(payload),
    onSuccess: () => {
      toast({ title: 'Annonce créée avec succès !' });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description:
          err.response?.data?.message || "Impossible de créer l'annonce",
        variant: 'destructive',
      });
    },
  });
}

/** Delete a listing by id and invalidate the my-listings cache. */
export function useDeleteListing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      toast({ title: 'Annonce supprimée' });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description:
          err.response?.data?.message || 'Erreur de suppression',
        variant: 'destructive',
      });
    },
  });
}

/** Update an existing listing. */
export function useUpdateListing(slug?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateListingPayload }) =>
      updateListing(id, payload),
    onSuccess: () => {
      toast({ title: 'Annonce modifiée avec succès !' });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ['listing', slug] });
      }
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description:
          err.response?.data?.message || "Impossible de modifier l'annonce",
        variant: 'destructive',
      });
    },
  });
}

/** Boost a listing (costs 10 Tks). Invalidates both my-listings and detail caches. */
export function useBoostListing(options?: { invalidateKeys?: string[][] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => boostListing(id),
    onSuccess: () => {
      toast({
        title: 'Annonce boostée !',
        description: '10 Tks déduits.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      if (options?.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description:
          err.response?.data?.message || 'Impossible de booster',
        variant: 'destructive',
      });
    },
  });
}

/** Toggle favourite on a listing — optimistic update flips the heart immediately. */
export function useToggleFavorite(slug: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (listingId: string) => toggleFavorite(listingId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['listing', slug] });
      const previous = queryClient.getQueryData<any>(['listing', slug]);
      if (previous) {
        queryClient.setQueryData(['listing', slug], (old: any) => ({
          ...old,
          isFavorited: !old?.isFavorited,
          _count: {
            ...old?._count,
            favorites: (old?._count?.favorites ?? 0) + (old?.isFavorited ? -1 : 1),
          },
        }));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['listing', slug], context.previous);
      }
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour les favoris', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Favoris mis à jour' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', slug] });
    },
  });
}

/** Fetch AI-powered similar listings for a given listing ID. */
export function useSimilarListings(listingId: string | undefined) {
  return useQuery({
    queryKey: ['similar-listings', listingId],
    queryFn: () => getSimilarListings(listingId!),
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
  });
}

/** AI — Price suggestion for a category + condition pair. */
export function usePriceSuggestion(categoryId: string | undefined, condition: string | undefined) {
  return useQuery({
    queryKey: ['price-suggestion', categoryId, condition],
    queryFn: () => suggestPrice(categoryId!, condition!),
    enabled: !!categoryId && !!condition,
    staleTime: 10 * 60 * 1000,
  });
}

/** AI — Auto-classify a listing title + description into category + tags. */
export function useClassifyListing(title: string, description: string) {
  return useQuery({
    queryKey: ['classify-listing', title, description],
    queryFn: () => classifyListing(title, description),
    enabled: title.length >= 10 && description.length >= 20,
    staleTime: 60 * 1000,
  });
}

/** AI — ETA prediction for a specific listing. */
export function useListingEta(listingId: string | undefined) {
  return useQuery({
    queryKey: ['listing-eta', listingId],
    queryFn: () => getListingEta(listingId!),
    enabled: !!listingId,
    staleTime: 30 * 60 * 1000,
  });
}

/** AI — Review sentiment summary for a specific listing. */
export function useListingReviewSentiment(listingId: string | undefined) {
  return useQuery({
    queryKey: ['listing-sentiment', listingId],
    queryFn: () => getListingReviewSentiment(listingId!),
    enabled: !!listingId,
    staleTime: 15 * 60 * 1000,
  });
}

/** Submit a review for a listing. */
export function useSubmitReview(listingId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) =>
      submitReview(listingId!, payload),
    onSuccess: () => {
      toast({ title: 'Avis publié' });
      queryClient.invalidateQueries({
        queryKey: ['listing-reviews', listingId],
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description:
          err.response?.data?.message || "Impossible de publier l'avis",
        variant: 'destructive',
      });
    },
  });
}
