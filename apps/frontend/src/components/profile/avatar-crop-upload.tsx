'use client';

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, ZoomIn, ZoomOut, RotateCw, Check, X, Loader2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media-url';

interface Area { x: number; y: number; width: number; height: number; }
interface Props { currentUrl?: string | null; onUploadComplete: (url: string) => void; }

async function cropImageToBlob(img: HTMLImageElement, pixelCrop: Area, rotation: number): Promise<Blob> {
  const size = Math.max(pixelCrop.width, pixelCrop.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(size / 2, size / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-size / 2, -size / 2);
  ctx.drawImage(img, -pixelCrop.x, -pixelCrop.y);

  const out = document.createElement('canvas');
  out.width = 400; out.height = 400;
  out.getContext('2d')!.drawImage(canvas, 0, 0, size, size, 0, 0, 400, 400);
  return new Promise((res, rej) =>
    out.toBlob((b) => b ? res(b) : rej(new Error('Canvas empty')), 'image/jpeg', 0.9),
  );
}

// ─── Isolated cropper — only this re-renders on mouse move ───────────────────
const CropperPane = memo(function CropperPane({
  image, crop, zoom, rotation,
  onCropChange, onZoomChange, onRotationChange, onCropComplete,
}: {
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  onCropChange: (c: { x: number; y: number }) => void;
  onZoomChange: (z: number) => void;
  onRotationChange: (r: number) => void;
  onCropComplete: (a: Area, p: Area) => void;
}) {
  return (
    <>
      <div className="relative w-full bg-black" style={{ height: 300 }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="p-4 space-y-3 border-t border-border">
        <div className="flex items-center gap-3">
          <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
          <input type="range" min={1} max={3} step={0.02} value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="flex-1 accent-primary h-1.5 cursor-pointer" />
          <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
        <div className="flex items-center gap-3">
          <RotateCw className="w-4 h-4 text-muted-foreground shrink-0" />
          <input type="range" min={0} max={360} step={1} value={rotation}
            onChange={(e) => onRotationChange(Number(e.target.value))}
            className="flex-1 accent-primary h-1.5 cursor-pointer" />
          <span className="text-xs text-muted-foreground w-9 text-right">{rotation}°</span>
        </div>
      </div>
    </>
  );
});

// ─── Main component — only re-renders for upload/error/open state ─────────────
export function AvatarCropUpload({ currentUrl, onUploadComplete }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const cropRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const rotationRef = useRef(0);
  const croppedAreaPixelsRef = useRef<Area | null>(null);

  // Local state only for values that need to drive CropperPane re-render
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);
  useEffect(() => { setImgFailed(false); }, [currentUrl]);

  const handleCropChange = useCallback((c: { x: number; y: number }) => {
    cropRef.current = c;
    setCrop(c);
  }, []);

  const handleZoomChange = useCallback((z: number) => {
    zoomRef.current = z;
    setZoom(z);
  }, []);

  const handleRotationChange = useCallback((r: number) => {
    rotationRef.current = r;
    setRotation(r);
  }, []);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    croppedAreaPixelsRef.current = pixels;
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Fichier invalide'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Max 10 Mo'); return; }

    setError(null);
    setProcessing(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    cropRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    rotationRef.current = 0;

    if (objectUrl) URL.revokeObjectURL(objectUrl);

    const rawUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(rawUrl);
        if (!blob) { setProcessing(false); return; }
        const resizedUrl = URL.createObjectURL(blob);
        const resized = new Image();
        resized.onload = () => {
          imgElRef.current = resized;
          setObjectUrl(resizedUrl);
          setProcessing(false);
        };
        resized.src = resizedUrl;
      }, 'image/jpeg', 0.92);
    };
    img.src = rawUrl;
  };

  const handleConfirm = async () => {
    if (!imgElRef.current || !croppedAreaPixelsRef.current) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await cropImageToBlob(imgElRef.current, croppedAreaPixelsRef.current, rotationRef.current);
      const formData = new FormData();
      formData.append('files', blob, 'avatar.jpg');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/uploads/avatars`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload échoué');
      const data = await res.json();
      onUploadComplete(data.urls?.[0] ?? data.url);
      handleCancel();
    } catch (err: any) {
      setError(err.message || "Erreur d'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    imgElRef.current = null;
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group cursor-pointer w-28 h-28 rounded-full border-4 border-primary/30 overflow-hidden bg-muted flex items-center justify-center shadow-md"
        onClick={() => !uploading && fileInputRef.current?.click()}>
        {getMediaUrl(currentUrl) && !imgFailed
          ? <img src={getMediaUrl(currentUrl)!} alt="Avatar" className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
          : <Camera className="w-10 h-10 text-muted-foreground" />}

        {/* Upload progress overlay on the circle */}
        {uploading ? (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
            <span className="text-white text-[10px] font-semibold">Envoi...</span>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <button type="button" onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed">
        {currentUrl ? 'Changer la photo' : 'Ajouter une photo'}
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      {processing && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Chargement...</p>}
      {error && !objectUrl && <p className="text-xs text-destructive">{error}</p>}

      {objectUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Ajuster la photo</h3>
              <button type="button" onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <CropperPane
              image={objectUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              onCropChange={handleCropChange}
              onZoomChange={handleZoomChange}
              onRotationChange={handleRotationChange}
              onCropComplete={onCropComplete}
            />

            <div className="px-4 pb-4 pt-2 flex gap-3">
              <button type="button" onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">
                Annuler
              </button>
              <button type="button" onClick={handleConfirm} disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-black text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {uploading ? 'Envoi en cours...' : 'Appliquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
