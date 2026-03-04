'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  ThumbsUp,
  Eye,
  Plus,
  ChevronRight,
  Loader2,
  Pin,
  Lock,
  Send,
  ArrowLeft,
  Heart,
  Reply,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

type ViewMode = 'forums' | 'posts' | 'post';

export default function ForumsPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('forums');
  const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
  const [selectedForumName, setSelectedForumName] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // New post form
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  // Comment form
  const [commentText, setCommentText] = useState('');

  const { t } = useT();

  // Fetch forums
  const { data: forums, isLoading: forumsLoading } = useQuery({
    queryKey: ['forums'],
    queryFn: () => api.get('/forums').then((r) => r.data),
  });

  // Fetch posts for selected forum
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['forum-posts', selectedForumId],
    queryFn: () => api.get(`/forums/${selectedForumId}/posts`).then((r) => r.data),
    enabled: !!selectedForumId && view === 'posts',
  });

  // Fetch single post
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['forum-post', selectedPostId],
    queryFn: () => api.get(`/forums/posts/${selectedPostId}`).then((r) => r.data),
    enabled: !!selectedPostId && view === 'post',
  });

  // Create post
  const createPostMutation = useMutation({
    mutationFn: () =>
      api.post('/forums/posts', {
        forumId: selectedForumId,
        authorId: userId,
        title: newTitle,
        content: newContent,
        tags: newTags ? newTags.split(',').map((tag) => tag.trim()) : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      setShowNewPost(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
    },
  });

  // Like
  const likeMutation = useMutation({
    mutationFn: (postId: string) => api.post(`/forums/posts/${postId}/like`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post'] });
    },
  });

  // Comment
  const commentMutation = useMutation({
    mutationFn: () =>
      api.post(`/forums/posts/${selectedPostId}/comments`, {
        authorId: userId,
        content: commentText,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post'] });
      setCommentText('');
    },
  });

  const openForum = (forumId: string, name: string) => {
    setSelectedForumId(forumId);
    setSelectedForumName(name);
    setView('posts');
  };

  const openPost = (postId: string) => {
    setSelectedPostId(postId);
    setView('post');
  };

  const goBack = () => {
    if (view === 'post') setView('posts');
    else setView('forums');
  };

  // ── FORUMS LIST VIEW ──
  if (view === 'forums') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#1a237e] font-heading">💬 {t.forums.title}</h1>
        <p className="text-sm text-gray-500">{t.forums.description}</p>

        {forumsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
        ) : !forums?.length ? (
          <Card className="border-[#d4c088]/40">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">Aucun forum disponible</h3>
              <p className="text-sm text-gray-400 mt-1">Les forums seront bientôt disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {forums.map((forum: any) => (
              <button
                key={forum.id}
                onClick={() => openForum(forum.id, forum.name)}
                className="w-full text-left"
              >
                <Card className="border-[#d4c088]/40 hover:border-[#c9a730] transition cursor-pointer">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: forum.color || '#1a237e' }}
                    >
                      {forum.icon || forum.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1a237e]">{forum.name}</h3>
                      {forum.description && <p className="text-xs text-gray-500 mt-0.5">{forum.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#c9a730]">{forum._count?.posts || 0}</p>
                      <p className="text-xs text-gray-400">discussions</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── POSTS LIST VIEW ──
  if (view === 'posts') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 text-gray-400 hover:text-[#1a237e] rounded-lg transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#1a237e] font-heading">{selectedForumName}</h1>
          </div>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] transition"
          >
            <Plus className="h-4 w-4" />
            Nouveau sujet
          </button>
        </div>

        {/* New post form */}
        {showNewPost && (
          <Card className="border-[#c9a730]">
            <CardContent className="p-5 space-y-4">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titre du sujet..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-[#c9a730]"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Votre message..."
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730] resize-none"
              />
              <input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags (séparés par des virgules)"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNewPost(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                  Annuler
                </button>
                <button
                  onClick={() => createPostMutation.mutate()}
                  disabled={!newTitle || !newContent || createPostMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#c9a730] text-white rounded-lg hover:bg-[#b8962c] disabled:opacity-50 transition"
                >
                  {createPostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Publier
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {postsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
        ) : !postsData?.posts?.length ? (
          <Card className="border-[#d4c088]/40">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">Aucune discussion</h3>
              <p className="text-sm text-gray-400 mt-1">Soyez le premier à lancer la discussion !</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {postsData.posts.map((p: any) => (
              <button key={p.id} onClick={() => openPost(p.id)} className="w-full text-left">
                <Card className="border-[#d4c088]/40 hover:border-[#c9a730] transition">
                  <CardContent className="p-4 flex items-start gap-3">
                    <img
                      src={p.author?.avatarUrl || '/default-avatar.png'}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-[#d4c088]/40 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {p.isPinned && <Pin className="h-3 w-3 text-[#c9a730]" />}
                        {p.isLocked && <Lock className="h-3 w-3 text-gray-400" />}
                        <h3 className="font-semibold text-sm text-[#1a237e] truncate">{p.title}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.author?.firstName} {p.author?.lastName} · {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {p.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {p.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs border-[#d4c088] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{p.viewCount}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{p._count?.likes || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{p._count?.comments || 0}</span>
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

  // ── SINGLE POST VIEW ──
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={goBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a237e] transition">
        <ArrowLeft className="h-4 w-4" />
        Retour aux discussions
      </button>

      {postLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
      ) : !post ? (
        <p className="text-gray-500">Publication non trouvée</p>
      ) : (
        <>
          <Card className="border-[#d4c088]/40">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <img
                  src={post.author?.avatarUrl || '/default-avatar.png'}
                  alt=""
                  className="w-12 h-12 rounded-full border-2 border-[#d4c088]/40 object-cover"
                />
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-[#1a237e]">{post.title}</h1>
                  <p className="text-xs text-gray-500 mt-1">
                    {post.author?.firstName} {post.author?.lastName} · {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                    {' · '}{post.viewCount} vues
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
              {post.tags?.length > 0 && (
                <div className="flex gap-1 mt-4">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs border-[#d4c088]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => likeMutation.mutate(post.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#c9a730] transition"
                >
                  <Heart className="h-4 w-4" />
                  {post._count?.likes || 0} J'aime
                </button>
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <MessageCircle className="h-4 w-4" />
                  {post._count?.comments || 0} Commentaires
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Commentaires</h3>
            {post.comments?.map((comment: any) => (
              <Card key={comment.id} className="border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.author?.avatarUrl || '/default-avatar.png'}
                      alt=""
                      className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#1a237e]">
                        {comment.author?.firstName} {comment.author?.lastName}
                        <span className="text-gray-400 font-normal ml-2">
                          {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                      {/* Nested replies */}
                      {comment.replies?.map((reply: any) => (
                        <div key={reply.id} className="mt-3 ml-6 pl-3 border-l-2 border-gray-100">
                          <p className="text-xs font-semibold text-[#1a237e]">
                            {reply.author?.firstName} {reply.author?.lastName}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add comment */}
            {!post.isLocked && (
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
                  onKeyDown={(e) => e.key === 'Enter' && commentText && commentMutation.mutate()}
                />
                <button
                  onClick={() => commentMutation.mutate()}
                  disabled={!commentText || commentMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] disabled:opacity-50 transition"
                >
                  {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
