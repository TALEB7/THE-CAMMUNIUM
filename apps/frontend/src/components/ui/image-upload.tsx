'use client';

import { useState, useRef, useCallback } from 'react';
import { ImagePlus, X, Loader2, GripVertical } from 'lucide-react';
import { uploadImages } from '@/api/uploads.api';

// ==================== Types ====================

interface ImageUploadProps {
  /** Current list of uploaded image URLs */
  value: string[];
  /** Callback when images change (add/remove/reorder) */
  onChange: (urls: string[]) => void;
  /** Max number of images allowed */
  maxImages?: number;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Upload folder on server */
  folder?: 'listings' | 'avatars' | 'documents';
}

interface PreviewImage {
  url: string;
  isUploading?: boolean;
  file?: File;
}

// ==================== Constants ====================

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// ==================== Component ====================

export function ImageUpload({
  value,
  onChange,
  maxImages = 8,
  maxSizeMB = 5,
  folder = 'listings',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = maxImages - value.length;

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const errors: string[] = [];
      const valid: File[] = [];
      const maxBytes = maxSizeMB * 1024 * 1024;

      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          errors.push(`"${file.name}" : type non autorisé (${file.type})`);
          continue;
        }
        if (file.size > maxBytes) {
          errors.push(
            `"${file.name}" : taille trop grande (${(file.size / 1024 / 1024).toFixed(1)} Mo > ${maxSizeMB} Mo)`,
          );
          continue;
        }
        valid.push(file);
      }

      // Respect max limit
      if (valid.length > remaining) {
        errors.push(
          `Seulement ${remaining} image(s) restante(s) — ${valid.length - remaining} ignorée(s)`,
        );
        valid.splice(remaining);
      }

      return { valid, errors };
    },
    [maxSizeMB, remaining],
  );

  const handleUpload = useCallback(
    async (files: File[]) => {
      const { valid, errors } = validateFiles(files);

      if (errors.length > 0) {
        setUploadError(errors.join('\n'));
      } else {
        setUploadError(null);
      }

      if (valid.length === 0) return;

      setIsUploading(true);
      try {
        const urls = await uploadImages(valid, folder);
        onChange([...value, ...urls]);
        setUploadError(null);
      } catch (err: any) {
        setUploadError(
          err?.response?.data?.message ||
            err?.userMessage ||
            "Erreur lors de l'upload. Veuillez réessayer.",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [validateFiles, folder, value, onChange],
  );

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleUpload(files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    if (files.length > 0) handleUpload(files);
  };

  // Remove image
  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  // Move image (for reorder)
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const newUrls = [...value];
    const [moved] = newUrls.splice(from, 1);
    newUrls.splice(to, 0, moved);
    onChange(newUrls);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !isUploading && remaining > 0 && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition ${
          dragOver
            ? 'border-primary bg-accent'
            : remaining > 0
              ? 'border-border hover:border-primary/50 hover:bg-muted'
              : 'cursor-not-allowed border-border bg-muted opacity-60'
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">Upload en cours...</p>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Glissez vos images ici ou{' '}
              <span className="text-primary underline">cliquez pour parcourir</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG, WebP, GIF — max {maxSizeMB} Mo par fichier — {remaining} restante(s)
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Error */}
      {uploadError && (
        <div className="whitespace-pre-wrap rounded-lg border border-red-200 bg-destructive/10 px-4 py-2 text-xs text-red-600">
          {uploadError}
        </div>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {value.map((url, idx) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Overlay actions */}
              <div className="absolute inset-0 flex items-start justify-between bg-black/0 p-1 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, idx - 1)}
                      className="rounded bg-card/90 p-0.5 text-xs hover:bg-card"
                      title="Déplacer avant"
                    >
                      ←
                    </button>
                  )}
                  {idx < value.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, idx + 1)}
                      className="rounded bg-card/90 p-0.5 text-xs hover:bg-card"
                      title="Déplacer après"
                    >
                      →
                    </button>
                  )}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="rounded-full bg-destructive p-1 text-white shadow hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* "Principale" badge for first image */}
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-medium text-[#ffd700]">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
