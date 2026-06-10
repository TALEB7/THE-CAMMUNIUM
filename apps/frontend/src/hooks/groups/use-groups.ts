import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Group, GroupPost, GroupsResponse, GroupPostsResponse } from '@/types';

export function useGroups(search?: string) {
  return useQuery<GroupsResponse>({
    queryKey: ['groups', search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      return api.get(`/groups?${params}`).then((r) => r.data);
    },
  });
}

export function useGroup(groupId: string | null) {
  return useQuery<Group>({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/groups/${groupId}`).then((r) => r.data),
    enabled: !!groupId,
  });
}

export function useGroupPosts(groupId: string | null) {
  return useQuery<GroupPostsResponse>({
    queryKey: ['group-posts', groupId],
    queryFn: () => api.get(`/groups/${groupId}/posts`).then((r) => r.data),
    enabled: !!groupId,
  });
}

export function useActiveMeeting(groupId: string | null, isMember: boolean) {
  return useQuery({
    queryKey: ['active-meeting', groupId],
    queryFn: () => api.get(`/meetings/group/${groupId}/active`).then((r) => r.data),
    enabled: !!groupId && isMember,
    refetchInterval: 10000,
  });
}

export function useCreateGroup(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; isPrivate: boolean; category?: string; ownerId: string }) =>
      api.post('/groups', data),
    onSuccess: () => {
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      api.post(`/groups/${groupId}/join`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      api.delete(`/groups/${groupId}/leave`, { data: { userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useCreateGroupPost(groupId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      authorId: string;
      content: string;
      images?: string[];
      attachments?: { url: string; name: string; type: string; size?: number }[];
    }) =>
      api.post(`/groups/${groupId}/posts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
    },
  });
}

export function useStartMeeting() {
  return useMutation({
    mutationFn: ({ groupId, hostId }: { groupId: string; hostId: string }) =>
      api.post('/meetings', { groupId, hostId }).then((r) => r.data),
  });
}
