import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Mentor {
  id: string;
  headline: string | null;
  expertise: string[];
  industries: string[];
  yearsExp: number | null;
  hourlyRate: number | null;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  user: { id: string; firstName: string; lastName: string; imageUrl?: string };
}

export function useMentors(userId?: string, search?: string) {
  return useQuery<any[]>({
    queryKey: ['mentors', userId, search],
    queryFn: () => {
      const endpoint = userId
        ? `/mentorship/mentors/match?menteeId=${userId}&goals=${encodeURIComponent(search || '')}`
        : '/mentorship/mentors';
      return api.get(endpoint).then((r) => {
        const all = userId ? (r.data || []) : (r.data?.mentors || []);
        if (!search) return all;
        const q = search.toLowerCase();
        return all.filter(
          (m: any) =>
            m.user.firstName?.toLowerCase().includes(q) ||
            m.user.lastName?.toLowerCase().includes(q) ||
            m.headline?.toLowerCase().includes(q) ||
            m.expertise.some((e: any) => e.toLowerCase().includes(q)),
        );
      });
    },
    staleTime: 60000,
  });
}

export function useRequestMentor() {
  return useMutation({
    mutationFn: ({ mentorProfileId, menteeId }: { mentorProfileId: string; menteeId: string }) =>
      api.post('/mentorship/requests', {
        mentorProfileId,
        menteeId,
        message: 'Je souhaite bénéficier de votre mentorat.',
      }),
  });
}
