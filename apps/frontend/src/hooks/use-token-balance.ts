import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-client';

export function useTokenBalance() {
  const { userId } = useAuth();
  const { data } = useQuery({
    queryKey: ['token-balance', userId],
    queryFn: () => api.get('/tokens/balance').then((r) => r.data),
    enabled: !!userId,
    staleTime: 60000,
  });
  return { balance: (data?.balance as number) ?? 0 };
}
