'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, ThumbsUp, MessageCircle, Pin, Lock, Clock } from 'lucide-react';
import type { ForumPost } from '@/types';
import { getMediaUrl } from '@/lib/media-url';

interface Props {
  post: ForumPost;
  onClick: () => void;
}

export function ForumPostRow({ post, onClick }: Props) {
  return (
    <button onClick={onClick} className="w-full text-left group">
      <Card className="border-0 shadow-sm bg-card/40 hover:bg-card/80 transition-all duration-300 ring-1 ring-border/50 hover:ring-primary/30 relative overflow-hidden">
        {post.isPinned && (
            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-10">
               <div className="absolute top-2 -right-6 bg-primary text-white text-[9px] font-bold uppercase tracking-widest py-1 px-8 rotate-45 shadow-sm">Épinglé</div>
            </div>
        )}
        <CardContent className="p-5 flex items-center gap-5">
          <div className="relative shrink-0">
            <img
              src={getMediaUrl(post.author?.avatarUrl) || '/default-avatar.png'}
              alt=""
              className="w-12 h-12 rounded-full ring-2 ring-background shadow-sm object-cover group-hover:ring-primary/30 transition-all duration-300"
            />
            {post.author?.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-background" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 pr-4 sm:pr-8">
            <div className="flex items-center gap-2 mb-1.5">
              {post.isLocked && <Lock className="h-3.5 w-3.5 text-red-500 shrink-0" />}
              <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">{post.title}</h3>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80 hover:underline">{post.author?.firstName} {post.author?.lastName}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 opacity-70" /> {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric'})}</span>
            </div>
            
            {post.tags?.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {post.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-0 px-2 py-0.5 transition-colors rounded-md">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-6 shrink-0 border-l border-border/50 pl-6 text-muted-foreground">
            <div className="flex flex-col items-center gap-1 group-hover:text-primary transition-colors">
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs font-semibold">{post._count?.comments ?? 0}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Eye className="h-5 w-5 opacity-50" />
              <span className="text-xs font-medium">{post.viewCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
