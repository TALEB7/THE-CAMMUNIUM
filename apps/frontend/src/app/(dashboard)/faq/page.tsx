'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle, ArrowLeft, Search, ChevronDown, ChevronRight,
  ThumbsUp, ThumbsDown, Eye, BookOpen, Sparkles,
} from 'lucide-react';

type ViewMode = 'home' | 'category' | 'item' | 'search';

export default function FaqPage() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('home');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // ── Queries ──
  const { data: categories = [] } = useQuery({
    queryKey: ['faq-categories'],
    queryFn: () => api.get('/faq/categories').then(r => r.data),
  });

  const { data: popularItems = [] } = useQuery({
    queryKey: ['faq-popular'],
    queryFn: () => api.get('/faq/items/popular?limit=5').then(r => r.data),
    enabled: view === 'home',
  });

  const { data: categoryItems = [] } = useQuery({
    queryKey: ['faq-items', selectedCat],
    queryFn: () => api.get(`/faq/categories/${selectedCat}/items`).then(r => r.data),
    enabled: view === 'category' && !!selectedCat,
  });

  const { data: itemDetail } = useQuery({
    queryKey: ['faq-item', selectedSlug],
    queryFn: () => api.get(`/faq/items/slug/${selectedSlug}`).then(r => r.data),
    enabled: view === 'item' && !!selectedSlug,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['faq-search', searchQuery],
    queryFn: () => api.get(`/faq/items/search?q=${encodeURIComponent(searchQuery)}`).then(r => r.data),
    enabled: view === 'search' && searchQuery.length >= 2,
  });

  // ── Helpful vote ──
  const voteHelpful = useMutation({
    mutationFn: (data: { id: string; helpful: boolean }) =>
      api.post(`/faq/items/${data.id}/helpful`, { helpful: data.helpful }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-item'] });
      queryClient.invalidateQueries({ queryKey: ['faq-popular'] });
    },
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const CATEGORY_ICONS: Record<string, string> = {
    '📚': '📚', '💰': '💰', '🤝': '🤝', '🔒': '🔒', '🛒': '🛒',
    '⚙️': '⚙️', '📱': '📱', '🎓': '🎓',
  };

  // ── Single FAQ item view ──
  if (view === 'item' && itemDetail) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('home')} className="p-2 hover:bg-primary/10 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-2xl font-bold text-primary">{t.faq.faqTitle}</h1>
        </div>

        <Card className="border-t-4 border-t-[#C8102E]">
          <CardContent className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-primary">{itemDetail.question}</h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {itemDetail.viewCount} {t.common.views}</span>
                {itemDetail.category && (
                  <Badge variant="outline" className="text-xs">{itemDetail.category.name}</Badge>
                )}
              </div>
            </div>

            <div className="prose max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {itemDetail.answer}
            </div>

            {itemDetail.tags && itemDetail.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {itemDetail.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs text-primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground mb-3">{t.faq.helpful}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => voteHelpful.mutate({ id: itemDetail.id, helpful: true })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                >
                  <ThumbsUp className="w-4 h-4" /> {t.common.yes} ({itemDetail.helpfulYes || 0})
                </button>
                <button
                  onClick={() => voteHelpful.mutate({ id: itemDetail.id, helpful: false })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-red-500 hover:bg-red-100"
                >
                  <ThumbsDown className="w-4 h-4" /> {t.common.no} ({itemDetail.helpfulNo || 0})
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Category view ──
  if (view === 'category' && selectedCat) {
    const cat = (categories as any[]).find((c: any) => c.id === selectedCat);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('home')} className="p-2 hover:bg-primary/10 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-2xl font-bold text-primary">
            {cat?.icon} {cat?.name || t.faq.category}
          </h1>
        </div>

        <div className="space-y-3">
          {(categoryItems as any[]).map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-all">
              <CardContent className="p-0">
                <button
                  className="w-full p-4 text-left flex items-center justify-between"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <span className="font-medium text-primary">{item.question}</span>
                  {expandedItems.has(item.id) ? (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                {expandedItems.has(item.id) && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="border-t pt-3 text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                      {item.answer}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => { setSelectedSlug(item.slug); setView('item'); }}
                        className="text-xs text-primary hover:underline"
                      >
                        {t.faq.viewFullArticle}
                      </button>
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => voteHelpful.mutate({ id: item.id, helpful: true })}
                          className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded flex items-center gap-1"
                        >
                          <ThumbsUp className="w-3 h-3" /> {item.helpfulYes || 0}
                        </button>
                        <button
                          onClick={() => voteHelpful.mutate({ id: item.id, helpful: false })}
                          className="text-xs text-red-500 hover:bg-destructive/10 px-2 py-1 rounded flex items-center gap-1"
                        >
                          <ThumbsDown className="w-3 h-3" /> {item.helpfulNo || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {(categoryItems as any[]).length === 0 && (
            <p className="text-center text-muted-foreground py-8">{t.faq.noArticles}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Search view ──
  if (view === 'search') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('home'); setSearchQuery(''); }} className="p-2 hover:bg-primary/10 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
              placeholder={t.faq.searchPlaceholder}
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-3">
          {(searchResults as any[]).map((item: any) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              onClick={() => { setSelectedSlug(item.slug); setView('item'); }}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold text-primary">{item.question}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
          {searchQuery.length >= 2 && (searchResults as any[]).length === 0 && (
            <p className="text-center text-muted-foreground py-8">{t.faq.noResults} &ldquo;{searchQuery}&rdquo;</p>
          )}
          {searchQuery.length < 2 && (
            <p className="text-center text-muted-foreground py-8">{t.faq.typeToSearch}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Home view ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">{t.faq.title}</h1>
            <p className="text-sm text-muted-foreground">{t.faq.description}</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <Card className="border-primary/30 bg-gradient-to-r from-[#faf6e9] to-white">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setView('search')}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-card"
              placeholder={t.faq.searchPlaceholder}
            />
          </div>
        </CardContent>
      </Card>

      {/* Popular articles */}
      {(popularItems as any[]).length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
            <Sparkles className="w-5 h-5 text-primary" /> {t.faq.popularArticles}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {(popularItems as any[]).map((item: any) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
                onClick={() => { setSelectedSlug(item.slug); setView('item'); }}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium text-primary text-sm">{item.question}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.answer}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {item.viewCount}
                      </span>
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {item.helpfulYes || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-primary">{t.faq.categories}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(categories as any[]).map((cat: any) => (
            <Card
              key={cat.id}
              className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group"
              onClick={() => { setSelectedCat(cat.id); setView('category'); }}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl group-hover:bg-[#C8102E]/20 transition-all">
                  {cat.icon || '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                  )}
                  <p className="text-xs text-primary mt-1">
                    {cat._count?.items || 0} {t.common.articles}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>
        {(categories as any[]).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg">{t.faq.noCategories}</p>
          </div>
        )}
      </div>
    </div>
  );
}
