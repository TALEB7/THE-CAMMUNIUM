import { api } from '@/lib/api';

// ==================== Types ====================

export interface ComparisonListItem {
  id: string;
  listing?: {
    id: string;
    title: string;
    slug: string;
    price: number;
    condition: string;
    city: string | null;
    images: string[];
    views?: number;
    viewCount?: number;
    seller?: {
      firstName: string;
      lastName: string;
    };
    category?: {
      name: string;
    };
  };
}

export interface ComparisonList {
  id: string;
  name: string;
  userId: string;
  items: ComparisonListItem[];
  createdAt: string;
}

// ==================== API Functions ====================

export async function getUserComparisonLists(
  userId: string,
): Promise<ComparisonList[]> {
  const { data } = await api.get<ComparisonList[]>(
    `/comparisons/user/${userId}`,
  );
  return data;
}

export async function createComparisonList(
  userId: string,
  name: string,
): Promise<ComparisonList> {
  const { data } = await api.post<ComparisonList>('/comparisons', {
    userId,
    name,
  });
  return data;
}

export async function deleteComparisonList(
  id: string,
  userId: string,
): Promise<void> {
  await api.delete(`/comparisons/${id}`, { data: { userId } });
}

export async function renameComparisonList(
  id: string,
  userId: string,
  name: string,
): Promise<void> {
  await api.patch(`/comparisons/${id}/rename`, { userId, name });
}

export async function removeComparisonItem(
  listId: string,
  itemId: string,
  userId: string,
): Promise<void> {
  await api.delete(`/comparisons/${listId}/items/${itemId}`, {
    data: { userId },
  });
}
