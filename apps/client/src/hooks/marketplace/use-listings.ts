import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getListings,
  getListingBySlug,
  getMyListings,
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
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateListingPayload) => createListing(payload),
    onSuccess: () => {
      toast({ title: 'Annonce créée avec succès !' });
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
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({ title: 'Annonce supprimée' });
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
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ['listing', slug] });
      }
      toast({ title: 'Annonce modifiée avec succès !' });
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
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      options?.invalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      toast({
        title: 'Annonce boostée !',
        description: '10 Tks déduits.',
      });
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

/** Toggle favourite on a listing. */
export function useToggleFavorite(slug: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (listingId: string) => toggleFavorite(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', slug] });
      toast({ title: 'Favoris mis à jour' });
    },
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
      queryClient.invalidateQueries({
        queryKey: ['listing-reviews', listingId],
      });
      toast({ title: 'Avis publié' });
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
