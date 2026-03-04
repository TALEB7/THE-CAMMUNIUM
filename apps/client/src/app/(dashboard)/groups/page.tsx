'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  Loader2,
  ArrowLeft,
  MessageCircle,
  Shield,
  Crown,
  LogOut,
  LogIn,
  Send,
  Search,
  Globe,
  Lock,
  Video,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

type ViewMode = 'browse' | 'detail' | 'create';

export default function GroupsPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('browse');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create form
  const [form, setForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    category: '',
  });

  // Post form
  const [postContent, setPostContent] = useState('');

  const { t } = useT();

  // Browse groups
  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['groups', searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      return api.get(`/groups?${params}`).then((r) => r.data);
    },
    enabled: view === 'browse',
  });

  // Single group
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', selectedGroupId],
    queryFn: () => api.get(`/groups/${selectedGroupId}`).then((r) => r.data),
    enabled: !!selectedGroupId && view === 'detail',
  });

  // Group posts
  const { data: postsData } = useQuery({
    queryKey: ['group-posts', selectedGroupId],
    queryFn: () => api.get(`/groups/${selectedGroupId}/posts`).then((r) => r.data),
    enabled: !!selectedGroupId && view === 'detail',
  });

  // Create group
  const createMutation = useMutation({
    mutationFn: () => api.post('/groups', { ...form, ownerId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setView('browse');
      setForm({ name: '', description: '', isPrivate: false, category: '' });
    },
  });

  // Join
  const joinMutation = useMutation({
    mutationFn: (groupId: string) => api.post(`/groups/${groupId}/join`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  // Leave
  const leaveMutation = useMutation({
    mutationFn: (groupId: string) => api.delete(`/groups/${groupId}/leave`, { data: { userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  // Post
  const postMutation = useMutation({
    mutationFn: () => api.post(`/groups/${selectedGroupId}/posts`, { authorId: userId, content: postContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      setPostContent('');
    },
  });

  const isMember = group?.members?.some((m: any) => m.userId === userId);
  const isOwner = group?.ownerId === userId;

  // Active meeting for the group
  const { data: activeMeeting } = useQuery({
    queryKey: ['active-meeting', selectedGroupId],
    queryFn: () => api.get(`/meetings/group/${selectedGroupId}/active`).then((r) => r.data),
    enabled: !!selectedGroupId && view === 'detail' && !!isMember,
    refetchInterval: 10000,
  });

  // Start a meeting
  const startMeetingMutation = useMutation({
    mutationFn: () => api.post('/meetings', { groupId: selectedGroupId, hostId: userId }),
    onSuccess: (res) => {
      router.push(`/meetings/${res.data.id}`);
    },
  });

  // ── BROWSE VIEW ──
  if (view === 'browse') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a237e] font-heading">👥 {t.groups.title}</h1>
            <p className="text-sm text-gray-500">{t.groups.description}</p>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] transition"
          >
            <Plus className="h-4 w-4" />
            {t.groups.createGroup}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.groups.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
        ) : !groupsData?.groups?.length ? (
          <Card className="border-[#d4c088]/40">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">{t.groups.noGroups}</h3>
              <p className="text-sm text-gray-400 mt-1">{t.groups.noGroupsDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupsData.groups.map((g: any) => (
              <button
                key={g.id}
                onClick={() => { setSelectedGroupId(g.id); setView('detail'); }}
                className="text-left"
              >
                <Card className="border-[#d4c088]/40 hover:border-[#c9a730] transition h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1a237e] to-[#283593] flex items-center justify-center text-white font-bold text-lg">
                        {g.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-sm text-[#1a237e] truncate">{g.name}</h3>
                          {g.isPrivate && <Lock className="h-3 w-3 text-gray-400" />}
                        </div>
                        {g.category && (
                          <Badge variant="outline" className="text-[10px] border-[#d4c088] mt-0.5">{g.category}</Badge>
                        )}
                      </div>
                    </div>
                    {g.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{g.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Users className="h-3 w-3" />
                      {g._count?.members || 0} {t.groups.members}
                      <span className="mx-1">·</span>
                      <MessageCircle className="h-3 w-3" />
                      {g._count?.posts || 0} {t.groups.posts}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── GROUP DETAIL VIEW ──
  if (view === 'detail') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => setView('browse')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a237e] transition">
          <ArrowLeft className="h-4 w-4" />
          {t.groups.allGroups}
        </button>

        {groupLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
        ) : !group ? (
          <p className="text-gray-500">{t.groups.groupNotFound}</p>
        ) : (
          <>
            {/* Header */}
            <Card className="border-[#d4c088]/40">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#283593] flex items-center justify-center text-white font-bold text-2xl">
                    {group.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-[#1a237e]">{group.name}</h1>
                      {group.isPrivate && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {t.groups.privateLabel}
                        </Badge>
                      )}
                    </div>
                    {group.description && <p className="text-sm text-gray-600 mt-1">{group.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{group._count?.members || group.members?.length || 0} {t.groups.members}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{group._count?.posts || 0} {t.groups.posts}</span>
                    </div>
                  </div>
                  <div>
                    {isOwner ? (
                      <Badge className="bg-[#c9a730]/10 text-[#c9a730] border-[#c9a730]/20 flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        {t.groups.owner}
                      </Badge>
                    ) : isMember ? (
                      <button
                        onClick={() => leaveMutation.mutate(group.id)}
                        disabled={leaveMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                      >
                        <LogOut className="h-3 w-3" />
                        {t.groups.leave}
                      </button>
                    ) : (
                      <button
                        onClick={() => joinMutation.mutate(group.id)}
                        disabled={joinMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#c9a730] text-white rounded-lg hover:bg-[#b8962c] disabled:opacity-50 transition"
                      >
                        {joinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                        {t.groups.join}
                      </button>
                    )}
                  </div>
                </div>

                {/* Meeting button */}
                {isMember && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                    {activeMeeting ? (
                      <button
                        onClick={() => router.push(`/meetings/${activeMeeting.id}`)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition animate-pulse"
                      >
                        <Video className="h-4 w-4" />
                        {t.groups.joinMeeting}
                      </button>
                    ) : (
                      <button
                        onClick={() => startMeetingMutation.mutate()}
                        disabled={startMeetingMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] disabled:opacity-50 transition"
                      >
                        {startMeetingMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                        {t.groups.startMeeting}
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Members */}
            {group.members?.length > 0 && (
              <Card className="border-[#d4c088]/40">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.groups.membersTitle}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.members.map((m: any) => {
                      const roleIcon = m.role === 'ADMIN' ? <Crown className="h-3 w-3 text-[#c9a730]" /> :
                                       m.role === 'MODERATOR' ? <Shield className="h-3 w-3 text-blue-500" /> : null;
                      return (
                        <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-xs">
                          <img
                            src={m.user?.avatarUrl || '/default-avatar.png'}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          {m.user?.firstName} {m.user?.lastName}
                          {roleIcon}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">{t.groups.publications}</h3>

              {/* New post */}
              {isMember && (
                <div className="flex gap-2">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={t.groups.writeSomething}
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730] resize-none"
                  />
                  <button
                    onClick={() => postMutation.mutate()}
                    disabled={!postContent || postMutation.isPending}
                    className="px-4 self-end py-2 text-sm font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] disabled:opacity-50 transition"
                  >
                    {postMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {!postsData?.posts?.length ? (
                <Card className="border-gray-100">
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="h-10 w-10 mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">{t.groups.noPublications}</p>
                  </CardContent>
                </Card>
                ) : (
                  postsData.posts.map((post: any) => (
                    <Card key={post.id} className="border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={post.author?.avatarUrl || '/default-avatar.png'}
                            alt=""
                            className="w-9 h-9 rounded-full border border-gray-200 object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-[#1a237e]">
                              {post.author?.firstName} {post.author?.lastName}
                              <span className="text-gray-400 font-normal ml-2">
                                {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </p>
                            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{post.content}</p>
                            {/* Comments */}
                            {post.comments?.length > 0 && (
                              <div className="mt-3 space-y-2 ml-4 border-l-2 border-gray-100 pl-3">
                                {post.comments.map((c: any) => (
                                  <div key={c.id}>
                                    <p className="text-xs text-gray-500">
                                      <span className="font-semibold text-[#1a237e]">{c.author?.firstName}</span>
                                      {' '}{c.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── CREATE GROUP VIEW ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => setView('browse')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a237e] transition">
        <ArrowLeft className="h-4 w-4" />
        {t.groups.back}
      </button>

      <h1 className="text-2xl font-bold text-[#1a237e] font-heading">{t.groups.createGroup}</h1>

      <Card className="border-[#d4c088]/40">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.groups.groupName}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.groups.descriptionLabel}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730] resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.groups.category}</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder={t.groups.categoryPlaceholder}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              className="rounded border-gray-300 text-[#c9a730] focus:ring-[#c9a730]"
            />
            <span className="text-sm text-gray-600">{t.groups.privateGroup}</span>
          </label>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.name || createMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-[#c9a730] text-white rounded-lg hover:bg-[#b8962c] disabled:opacity-50 transition"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t.groups.createBtn}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
