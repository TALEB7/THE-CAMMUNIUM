'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Loader2, Send } from 'lucide-react';
import type { ForumPost } from '@/types';
import { getMediaUrl } from '@/lib/media-url';

interface Props {
  post: ForumPost;
  isLiking: boolean;
  isCommenting: boolean;
  onLike: () => void;
  onComment: (content: string) => void;
  currentUserId: string | null;
  onDeletePost?: () => void;
  onDeleteComment?: (commentId: string) => void;
}

export function ForumPostDetail({ post, isLiking, isCommenting, onLike, onComment, currentUserId, onDeletePost, onDeleteComment }: Props) {
  const [commentText, setCommentText] = useState('');

  const submitComment = () => {
    if (!commentText.trim()) return;
    onComment(commentText);
    setCommentText('');
  };

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <img
              src={getMediaUrl(post.author?.avatarUrl) || '/default-avatar.png'}
              alt=""
              className="w-12 h-12 rounded-full border-2 border-border object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-xl font-bold text-primary">{post.title}</h1>
                {currentUserId === post.author?.id && onDeletePost && (
                  <button onClick={() => { if (window.confirm('Supprimer ce sujet ?')) onDeletePost(); }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {post.author?.firstName} {post.author?.lastName} · {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                {' · '}{post.viewCount} vues
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {post.content.split('\n').map((line, i) => {
              const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
              if (imgMatch) {
                return (
                  <img key={i} src={imgMatch[1]} alt="Attached" className="mt-4 rounded-xl max-h-96 w-full object-cover border border-border" />
                );
              }
              const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
              if (linkMatch && !line.startsWith('!')) {
                return (
                  <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium block mt-2">
                    📄 {linkMatch[1]}
                  </a>
                );
              }
              return <span key={i}>{line}<br /></span>;
            })}
          </div>
          {post.tags?.length > 0 && (
            <div className="flex gap-1 mt-4 flex-wrap">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-[#C8102E]">{tag}</Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <button
              onClick={onLike}
              disabled={isLiking}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary disabled:opacity-50 transition"
            >
              <Heart className="h-4 w-4" />
              {post._count?.likes ?? 0} J'aime
            </button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {post._count?.comments ?? 0} Commentaires
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground/80">Commentaires</h3>
        {post.comments?.map((comment) => (
          <Card key={comment.id} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <img
                  src={getMediaUrl(comment.author?.avatarUrl) || '/default-avatar.png'}
                  alt=""
                  className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-semibold text-primary">
                      {comment.author?.firstName} {comment.author?.lastName}
                      <span className="text-muted-foreground font-normal ml-2">
                        {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </p>
                    {currentUserId === comment.author?.id && onDeleteComment && (
                      <button onClick={() => { if (window.confirm('Supprimer ce commentaire ?')) onDeleteComment(comment.id); }} className="text-muted-foreground hover:text-destructive transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                  {comment.replies?.map((reply) => (
                    <div key={reply.id} className="mt-3 ml-6 pl-3 border-l-2 border-border">
                      <p className="text-xs font-semibold text-primary">{reply.author?.firstName} {reply.author?.lastName}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!post.isLocked && (
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            />
            <button
              onClick={submitComment}
              disabled={!commentText || isCommenting}
              className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:brightness-110 disabled:opacity-50 transition"
            >
              {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
