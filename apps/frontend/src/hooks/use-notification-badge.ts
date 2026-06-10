import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-client';

export function useNotificationBadge() {
  const { userId } = useAuth();
  const { data } = useQuery({
    queryKey: ['notification-badge', userId],
    queryFn: () => api.get(`/notifications/${userId}/unread-count`).then((r) => r.data),
    enabled: !!userId,
    refetchInterval: 30000,
    staleTime: 20000,
  });
  return { unread: (data?.unreadCount as number) ?? 0 };
}
