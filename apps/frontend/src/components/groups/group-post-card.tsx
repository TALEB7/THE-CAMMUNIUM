'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { GroupPost, Attachment } from '@/types';
import { getMediaUrl } from '@/lib/media-url';
import {
  FileText, FileSpreadsheet, FileImage, File, Download,
  Image as ImageIcon, Paperclip, ChevronLeft, ChevronRight, X,
  Heart, MessageCircle,
} from 'lucide-react';

interface Props {
  post: GroupPost;
}

/* ── Helpers ── */

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileIcon(type: string) {
  if (type === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (type.includes('spreadsheet') || type.includes('excel') || type === 'text/csv')
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  if (type.includes('word') || type.includes('document'))
    return <FileText className="h-5 w-5 text-blue-600" />;
  if (type.includes('presentation') || type.includes('powerpoint'))
    return <FileText className="h-5 w-5 text-orange-500" />;
  if (type.startsWith('image/'))
    return <FileImage className="h-5 w-5 text-purple-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function getFileExtBadge(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
}

/* ── Image Lightbox ── */

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition z-10"
      >
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
            className="absolute right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <img
        src={getMediaUrl(images[idx]) || ''}
        alt=""
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`h-2 w-2 rounded-full transition ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Attachment Card ── */

function AttachmentItem({ att }: { att: Attachment }) {
  const url = getMediaUrl(att.url);

  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5 hover:bg-muted hover:border-primary/30 transition"
    >
      <div className="shrink-0">
        {getFileIcon(att.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition">
          {att.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {getFileExtBadge(att.name)} {att.size ? `• ${formatFileSize(att.size)}` : ''}
        </p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0" />
    </a>
  );
}

/* ── PDF Preview ── */

function PdfPreview({ att }: { att: Attachment }) {
  const url = getMediaUrl(att.url);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
        <FileText className="h-4 w-4 text-red-500" />
        <span className="text-xs font-medium text-foreground truncate flex-1">{att.name}</span>
        <a
          href={url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Download className="h-3 w-3" /> Ouvrir
        </a>
      </div>
      <div className="h-[300px] bg-white">
        <iframe
          src={`${url}#toolbar=0&navpanes=0`}
          className="w-full h-full"
          title={att.name}
        />
      </div>
    </div>
  );
}

/* ── Main Component ── */

export function GroupPostCard({ post }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const images = post.images || [];
  const attachments: Attachment[] = (post.attachments as Attachment[]) || [];
  const pdfAttachments = attachments.filter((a) => a.type === 'application/pdf');
  const otherAttachments = attachments.filter((a) => a.type !== 'application/pdf');

  return (
    <>
      <Card className="border-border overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Author */}
          <div className="flex items-start gap-3">
            <img
              src={getMediaUrl(post.author?.avatarUrl) || '/default-avatar.png'}
              alt=""
              className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {post.author?.firstName} {post.author?.lastName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            {post.isPinned && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                📌 Épinglé
              </span>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-foreground/85 mt-3 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className={`mt-3 gap-1.5 rounded-lg overflow-hidden ${
              images.length === 1 ? 'grid grid-cols-1' :
              images.length === 2 ? 'grid grid-cols-2' :
              images.length === 3 ? 'grid grid-cols-2 grid-rows-2' :
              'grid grid-cols-2 grid-rows-2'
            }`}>
              {images.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`relative overflow-hidden bg-muted cursor-pointer group ${
                    images.length === 1 ? 'aspect-video' :
                    images.length === 3 && i === 0 ? 'row-span-2 aspect-square' :
                    'aspect-square'
                  }`}
                >
                  <img
                    src={getMediaUrl(img) || ''}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {i === 3 && images.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">+{images.length - 4}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* PDF Previews */}
          {pdfAttachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {pdfAttachments.map((att, i) => (
                <PdfPreview key={`pdf-${i}`} att={att} />
              ))}
            </div>
          )}

          {/* Other Attachments */}
          {otherAttachments.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {otherAttachments.length} fichier{otherAttachments.length > 1 ? 's' : ''} joint{otherAttachments.length > 1 ? 's' : ''}
                </span>
              </div>
              {otherAttachments.map((att, i) => (
                <AttachmentItem key={`att-${i}`} att={att} />
              ))}
            </div>
          )}

          {/* Stats & Comments */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span className="text-xs">{post.likeCount || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{post.commentCount || 0}</span>
            </div>
            {images.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-xs">{images.length} image{images.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                <Paperclip className="h-3.5 w-3.5" />
                <span className="text-xs">{attachments.length} fichier{attachments.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="mt-3 space-y-2 ml-4 border-l-2 border-primary/10 pl-3">
              {post.comments.map((c) => (
                <div key={c.id}>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.author?.firstName}</span>
                    {' '}{c.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
