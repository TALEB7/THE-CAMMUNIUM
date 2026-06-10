import { useQuery } from '@tanstack/react-query';
import { getCategoriesTree } from '@/api/marketplace.api';

/** Fetches the full category tree (parents + children). */
export function useCategoriesTree() {
  return useQuery({
    queryKey: ['categories-tree'],
    queryFn: getCategoriesTree,
    staleTime: 5 * 60 * 1000, // categories rarely change — cache 5 min
  });
}
