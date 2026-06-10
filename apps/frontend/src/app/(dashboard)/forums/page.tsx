'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-client';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { ForumCard } from '@/components/forums/forum-card';
import { ForumPostRow } from '@/components/forums/forum-post-row';
import { ForumPostDetail } from '@/components/forums/forum-post-detail';
import { NewPostForm } from '@/components/forums/new-post-form';
import { NewForumModal } from '@/components/forums/new-forum-modal';
import {
  useForums, useForumPosts, useForumPost,
  useCreateForumPost, useLikeForumPost, useAddForumComment,
  useCreateForum, useDeleteForum, useUpdateForum,
  useDeleteForumPost, useDeleteForumComment
} from '@/hooks/forums/use-forums';

type ViewMode = 'forums' | 'posts' | 'post';

export default function ForumsPage() {
  const { userId } = useAuth();
  const { t } = useT();

  const [view, setView] = useState<ViewMode>('forums');
  const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
  const [selectedForumName, setSelectedForumName] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showForumModal, setShowForumModal] = useState(false);
  const [forumToEdit, setForumToEdit] = useState<any>(null);

  const { data: forums, isLoading: forumsLoading } = useForums();
  const { data: postsData, isLoading: postsLoading } = useForumPosts(view === 'posts' ? selectedForumId : null);
  const { data: post, isLoading: postLoading } = useForumPost(view === 'post' ? selectedPostId : null);

  const createForum = useCreateForum(() => setShowForumModal(false));
  const updateForum = useUpdateForum(() => setShowForumModal(false));
  const deleteForum = useDeleteForum();

  const createPost = useCreateForumPost(selectedForumId, () => setShowNewPost(false));
  const likePost = useLikeForumPost();
  const addComment = useAddForumComment(selectedPostId);
  
  const deletePost = useDeleteForumPost(() => setView('posts'));
  const deleteComment = useDeleteForumComment(selectedPostId);

  const openForum = (id: string, name: string) => { setSelectedForumId(id); setSelectedForumName(name); setView('posts'); };
  const openPost = (id: string) => { setSelectedPostId(id); setView('post'); };
  const goBack = () => view === 'post' ? setView('posts') : setView('forums');

  // ── FORUMS LIST ──
  if (view === 'forums') {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border border-border/50 p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
                Le Forum <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Communium</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t.forums.description} Échangez avec des professionnels, partagez vos connaissances et trouvez des réponses à vos questions.
              </p>
            </div>
            
            <button
              onClick={() => { setForumToEdit(null); setShowForumModal(true); }}
              className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold bg-primary text-white rounded-xl shadow-md hover:shadow-lg hover:bg-primary/90 transition-all duration-300 w-fit shrink-0"
            >
              <Plus className="h-5 w-5" />
              Créer un forum
            </button>
          </div>
        </div>

        <NewForumModal
          isOpen={showForumModal}
          onClose={() => setShowForumModal(false)}
          onSubmit={(data) => {
            if (forumToEdit) {
              updateForum.mutate({ id: forumToEdit.id, data });
            } else {
              createForum.mutate(data);
            }
          }}
          isPending={createForum.isPending || updateForum.isPending}
          initialData={forumToEdit}
        />

        {forumsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !forums?.length ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Aucun forum disponible</h3>
              <p className="text-sm text-muted-foreground mt-1">Les forums seront bientôt disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forums.map((forum) => (
              <ForumCard 
                key={forum.id} 
                forum={forum} 
                onClick={() => openForum(forum.id, forum.name)} 
                onEdit={() => { setForumToEdit(forum); setShowForumModal(true); }}
                onDelete={() => {
                  if (window.confirm('Voulez-vous vraiment supprimer ce forum et tous ses sujets ?')) {
                    deleteForum.mutate(forum.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── POSTS LIST ──
  if (view === 'posts') {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/30 p-4 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-2 bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/50 rounded-xl transition shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
               <h1 className="text-2xl font-bold text-foreground tracking-tight">{selectedForumName}</h1>
               <p className="text-sm text-muted-foreground">Rejoignez la discussion avec la communauté</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl shadow-md hover:shadow-lg hover:bg-primary/90 transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Nouveau sujet
          </button>
        </div>

        {showNewPost && (
          <NewPostForm
            isPending={createPost.isPending}
            isError={createPost.isError}
            onSubmit={(data) => createPost.mutate({ ...data, authorId: userId! })}
            onCancel={() => setShowNewPost(false)}
          />
        )}

        {postsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !postsData?.posts?.length ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Aucune discussion</h3>
              <p className="text-sm text-muted-foreground mt-1">Soyez le premier à lancer la discussion !</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {postsData.posts.map((p) => (
              <ForumPostRow key={p.id} post={p} onClick={() => openPost(p.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── SINGLE POST ──
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <button onClick={goBack} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/50 rounded-xl transition shadow-sm w-fit">
        <ArrowLeft className="h-4 w-4" />
        Retour aux discussions
      </button>

      {postLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !post ? (
        <p className="text-muted-foreground">Publication non trouvée</p>
      ) : (
        <ForumPostDetail
          post={post}
          isLiking={likePost.isPending}
          isCommenting={addComment.isPending}
          onLike={() => likePost.mutate({ postId: post.id, userId: userId! })}
          onComment={(content) => addComment.mutate({ authorId: userId!, content })}
          currentUserId={userId || null}
          onDeletePost={() => deletePost.mutate({ postId: post.id, authorId: userId || '' })}
          onDeleteComment={(commentId) => deleteComment.mutate({ commentId, authorId: userId || '' })}
        />
      )}
    </div>
  );
}
