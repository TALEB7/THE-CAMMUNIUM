'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send, Image as ImageIcon, FileText, X, Upload, Check } from 'lucide-react';

interface Props {
  isPending: boolean;
  isError?: boolean;
  onSubmit: (data: { title: string; content: string; tags: string[] }) => void;
  onCancel: () => void;
}

export function NewPostForm({ isPending, isError, onSubmit, onCancel }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('files', file);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/uploads/listings`, { method: 'POST', body: formData });
      const data = await res.json();
      setUploadedUrl(data.urls?.[0] ?? data.url);
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!title.trim() || (!content.trim() && !uploadedUrl)) return;
    
    let finalContent = content.trim();
    if (uploadedUrl) {
      if (previewUrl) {
        finalContent += `\n\n![Image](${uploadedUrl})`;
      } else {
        finalContent += `\n\n[${fileName || 'Document joint'}](${uploadedUrl})`;
      }
    }
    
    onSubmit({ title: title.trim(), content: finalContent, tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [] });
  };

  return (
    <Card className="border-primary">
      <CardContent className="p-5 space-y-4">
        {isError && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
            ⚠ Une erreur est survenue. Vérifiez que vous êtes connecté et réessayez.
          </p>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du sujet..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:border-primary"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Votre message..."
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary resize-none"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (séparés par des virgules)"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
        />

        {/* Media Preview */}
        {previewUrl && (
          <div className="relative rounded-xl overflow-hidden border border-border mt-2 inline-block max-w-[200px]">
            <img src={previewUrl} alt="preview" className="w-full h-auto" />
            <button
              onClick={() => { setPreviewUrl(null); setUploadedUrl(null); setFileName(null); }}
              className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        )}

        {!previewUrl && fileName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs text-foreground mt-2 w-fit">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate max-w-[200px]">{fileName}</span>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin ml-2" /> : <Check className="h-3 w-3 text-green-500 ml-2" />}
            <button onClick={() => { setUploadedUrl(null); setFileName(null); }} className="ml-2"><X className="h-3 w-3 text-muted-foreground" /></button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition disabled:opacity-50"
            >
              <ImageIcon className="h-4 w-4 text-green-500" />
              <span className="hidden sm:inline">Image/PDF</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground/80 transition">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || (!content.trim() && !uploadedUrl) || uploading || isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publier
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
