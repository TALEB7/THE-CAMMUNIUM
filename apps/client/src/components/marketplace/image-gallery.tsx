'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ==================== Types ====================

interface ImageGalleryProps {
  images: string[];
  title: string;
  isBoosted?: boolean;
}

// ==================== Component ====================

export function ImageGallery({ images, title, isBoosted }: ImageGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/10] bg-gray-100">
        {images.length > 0 ? (
          <img
            src={images[currentImage]}
            alt={title}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl text-gray-300">
            📦
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage(Math.max(0, currentImage - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() =>
                setCurrentImage(Math.min(images.length - 1, currentImage + 1))
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {isBoosted && (
          <Badge className="absolute left-3 top-3 bg-amber-500">⚡ Boosté</Badge>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 p-3">
          {images.map((img: string, i: number) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`h-16 w-16 overflow-hidden rounded border-2 ${
                i === currentImage ? 'border-[#c9a730]' : 'border-transparent'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
