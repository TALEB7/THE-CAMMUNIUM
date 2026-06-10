'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function AiInsightsWidget() {
  const { data: trending, isLoading } = useQuery({
    queryKey: ['trending-categories'],
    queryFn: () => api.get('/analytics/trending-categories?topK=5').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const categories: any[] = trending?.trending || trending || [];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Tendances IA</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-xs text-muted-foreground">Données insuffisantes</p>
      ) : (
        <div className="space-y-2">
          {categories.slice(0, 5).map((cat: any, i: number) => (
            <div key={cat.category || i} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                <span className="text-xs font-medium text-foreground truncate">{cat.category}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs font-bold text-green-500">
                  +{Math.round((cat.growth_rate ?? 0) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link href="/marketplace"
        className="mt-3 block text-center text-xs text-primary font-semibold hover:underline">
        Explorer le marché →
      </Link>
    </div>
  );
}
