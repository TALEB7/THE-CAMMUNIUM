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

export function useMentors(search?: string) {
  return useQuery<Mentor[]>({
    queryKey: ['mentors', search],
    queryFn: () =>
      api.get('/mentorship/mentors').then((r) => {
        const all: Mentor[] = r.data.mentors || [];
        if (!search) return all;
        const q = search.toLowerCase();
        return all.filter(
          (m) =>
            m.user.firstName?.toLowerCase().includes(q) ||
            m.user.lastName?.toLowerCase().includes(q) ||
            m.headline?.toLowerCase().includes(q) ||
            m.expertise.some((e) => e.toLowerCase().includes(q)),
        );
      }),
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
