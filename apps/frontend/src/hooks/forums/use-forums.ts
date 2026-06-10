import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Forum, ForumPost, ForumPostsResponse } from '@/types';

export function useForums() {
  return useQuery<Forum[]>({
    queryKey: ['forums'],
    queryFn: () => api.get('/forums').then((r) => r.data),
  });
}

export function useCreateForum(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) => {
      // Auto-generate slug from name
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
      return api.post('/forums', { ...data, slug });
    },
    onSuccess: () => {
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ['forums'] });
    },
  });
}

export function useDeleteForum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (forumId: string) => api.delete(`/forums/${forumId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forums'] });
    },
  });
}

export function useUpdateForum(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; color?: string } }) => {
      // Auto-generate slug from name just in case they change the name
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
      return api.put(`/forums/${id}`, { ...data, slug });
    },
    onSuccess: () => {
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ['forums'] });
    },
  });
}

export function useForumPosts(forumId: string | null) {
  return useQuery<ForumPostsResponse>({
    queryKey: ['forum-posts', forumId],
    queryFn: () => api.get(`/forums/${forumId}/posts`).then((r) => r.data),
    enabled: !!forumId,
  });
}

export function useForumPost(postId: string | null) {
  return useQuery<ForumPost>({
    queryKey: ['forum-post', postId],
    queryFn: () => api.get(`/forums/posts/${postId}`).then((r) => r.data),
    enabled: !!postId,
  });
}

export function useCreateForumPost(forumId: string | null, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { authorId: string; title: string; content: string; tags: string[] }) =>
      api.post('/forums/posts', { ...data, forumId }),
    onSuccess: () => {
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forums'] });
    },
    onError: (err: any) => {
      console.error('Forum post error:', err?.response?.data || err);
    },
  });
}

export function useLikeForumPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      api.post(`/forums/posts/${postId}/like`, { userId }),
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post', postId] });
    },
  });
}

export function useAddForumComment(postId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ authorId, content }: { authorId: string; content: string }) =>
      api.post(`/forums/posts/${postId}/comments`, { authorId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', postId] });
    },
  });
}

export function useDeleteForumPost(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, authorId }: { postId: string; authorId: string }) =>
      api.delete(`/forums/posts/${postId}`, { data: { authorId } }),
    onSuccess: () => {
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forums'] });
    },
  });
}

export function useDeleteForumComment(postId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, authorId }: { commentId: string; authorId: string }) =>
      api.delete(`/forums/comments/${commentId}`, { data: { authorId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', postId] });
    },
  });
}
