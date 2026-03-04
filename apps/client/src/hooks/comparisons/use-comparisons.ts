import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserComparisonLists,
  createComparisonList,
  deleteComparisonList,
  renameComparisonList,
  removeComparisonItem,
} from '@/api/comparisons.api';

/** Fetch all comparison lists for the current user. */
export function useComparisonLists(userId: string | undefined | null) {
  return useQuery({
    queryKey: ['comparisons', userId],
    queryFn: () => getUserComparisonLists(userId!),
    enabled: !!userId,
  });
}

/** Create a new comparison list. */
export function useCreateComparisonList(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createComparisonList(userId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparisons'] });
    },
  });
}

/** Delete a comparison list. */
export function useDeleteComparisonList(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteComparisonList(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparisons'] });
    },
  });
}

/** Rename a comparison list. */
export function useRenameComparisonList(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameComparisonList(id, userId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparisons'] });
    },
  });
}

/** Remove an item from a comparison list. */
export function useRemoveComparisonItem(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      removeComparisonItem(listId, itemId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparisons'] });
    },
  });
}
