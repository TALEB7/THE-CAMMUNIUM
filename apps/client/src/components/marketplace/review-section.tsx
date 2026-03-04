'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Send, MessageCircle } from 'lucide-react';

// ==================== Types ====================

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface ReviewSectionProps {
  reviews: Review[] | undefined;
  avgRating: string | null;
  onSubmit: (data: { rating: number; comment?: string }, onSuccess: () => void) => void;
  isSubmitting: boolean;
}

// ==================== Component ====================

export function ReviewSection({
  reviews,
  avgRating,
  onSubmit,
  isSubmitting,
}: ReviewSectionProps) {
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Avis ({reviews?.length || 0})
          </CardTitle>
          {avgRating && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium">{avgRating}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Review */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-medium">Laisser un avis</h4>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setReviewRating(n)}
                className={`text-xl ${n <= reviewRating ? 'text-amber-400' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Votre commentaire (optionnel)..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                onSubmit(
                  { rating: reviewRating, comment: reviewComment || undefined },
                  () => setReviewComment(''),
                );
              }}
              disabled={isSubmitting}
              className="rounded bg-[#1a237e] px-4 py-2 text-sm font-medium text-[#ffd700] hover:bg-[#283593] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Review List */}
        {reviews?.map((review) => (
          <div key={review.id} className="border-b pb-3 last:border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8eaf6] text-xs font-bold text-[#1a237e]">
                  {review.reviewer?.firstName?.[0]}
                </div>
                <span className="text-sm font-medium">
                  {review.reviewer?.firstName} {review.reviewer?.lastName?.[0]}.
                </span>
                <div className="flex text-amber-400">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {review.comment && (
              <p className="mt-1 pl-9 text-sm text-gray-600">{review.comment}</p>
            )}
          </div>
        ))}

        {(!reviews || reviews.length === 0) && (
          <p className="text-center text-sm text-gray-400">Aucun avis pour le moment</p>
        )}
      </CardContent>
    </Card>
  );
}
