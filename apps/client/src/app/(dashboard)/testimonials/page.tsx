'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquareQuote,
  Star,
  Send,
  Loader2,
  User,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function TestimonialsPage() {
  const { t } = useT();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');

  // Featured testimonials
  const { data: featured } = useQuery({
    queryKey: ['testimonials-featured'],
    queryFn: () => api.get('/testimonials/featured').then((r) => r.data),
  });

  // All approved testimonials
  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => api.get('/testimonials').then((r) => r.data),
  });

  // User's own testimonials
  const { data: myTestimonials } = useQuery({
    queryKey: ['my-testimonials', userId],
    queryFn: () => api.get(`/testimonials/user/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.post('/testimonials', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-testimonials'] });
      setShowForm(false);
      setContent('');
      setRating(5);
      setRole('');
      setCompany('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({ clerkId: userId, content, rating, role, company });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading tracking-wide flex items-center gap-2">
            <MessageSquareQuote className="h-7 w-7 text-[#c9a730]" />
            {t.testimonials.title}
          </h1>
          <p className="text-gray-500">{t.testimonials.description}</p>
          <div className="h-0.5 bg-gradient-to-r from-[#c9a730] via-[#e6c200] to-transparent max-w-[120px] mt-1" />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gradient-to-r from-[#c9a730] to-[#e6c200] text-[#1a237e] font-bold text-sm rounded-lg hover:shadow-md transition-all"
        >
          {showForm ? t.common.cancel : t.testimonials.writeTestimonial}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <Card className="border-[#c9a730]/40">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1a237e]">{t.testimonials.shareExperience}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.testimonials.yourTestimonial}</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.testimonials.placeholderContent}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50 resize-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.testimonials.rating}</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className="p-1"
                      >
                        <Star className={`h-6 w-6 ${n <= rating ? 'text-[#c9a730] fill-[#c9a730]' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.testimonials.position}</label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder={t.testimonials.placeholderRole}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.testimonials.company}</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder={t.testimonials.placeholderCompany}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{t.testimonials.submitNote}</p>
                <button
                  type="submit"
                  disabled={submitMutation.isPending || !content.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-[#1a237e] text-white font-semibold text-sm rounded-lg hover:bg-[#283593] disabled:opacity-50 transition"
                >
                  {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t.common.send}
                </button>
              </div>
              {submitMutation.isSuccess && (
                <p className="text-sm text-green-600 font-medium">{t.testimonials.testimonialSent}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Featured */}
      {featured?.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#c9a730] uppercase tracking-wider mb-3 flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> {t.testimonials.featured}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((item: any) => (
              <TestimonialCard key={item.id} testimonial={item} isFeatured />
            ))}
          </div>
        </div>
      )}

      {/* All approved */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
          {t.testimonials.allTestimonials} ({testimonials?.length ?? 0})
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#c9a730]" /></div>
        ) : !testimonials?.length ? (
          <Card className="border-[#d4c088]/40">
            <CardContent className="py-12 text-center">
              <MessageSquareQuote className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">{t.testimonials.noTestimonials}</p>
              <p className="text-xs text-gray-400 mt-1">{t.testimonials.beFirst}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((item: any) => (
              <TestimonialCard key={item.id} testimonial={item} />
            ))}
          </div>
        )}
      </div>

      {/* My testimonials */}
      {myTestimonials?.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
            {t.testimonials.myTestimonials}
          </h2>
          <div className="space-y-3">
            {myTestimonials.map((item: any) => (
              <Card key={item.id} className="border-[#d4c088]/40">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < item.rating ? 'text-[#c9a730] fill-[#c9a730]' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <Badge variant={item.isApproved ? 'default' : 'secondary'} className="text-xs">
                      {item.isApproved ? t.common.approved : t.common.pending}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{item.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestimonialCard({ testimonial: item, isFeatured }: { testimonial: any; isFeatured?: boolean }) {
  return (
    <Card className={`border-[#d4c088]/40 ${isFeatured ? 'bg-gradient-to-br from-[#fff8e1]/50 to-white border-[#c9a730]/40' : ''}`}>
      <CardContent className="pt-5">
        {/* Stars */}
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < item.rating ? 'text-[#c9a730] fill-[#c9a730]' : 'text-gray-200'}`} />
          ))}
          {isFeatured && <Sparkles className="h-3.5 w-3.5 text-[#c9a730] ml-1" />}
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{item.content}&rdquo;</p>

        {/* Author */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
          <div className="w-9 h-9 rounded-full bg-[#1a237e]/10 flex items-center justify-center">
            <User className="h-4 w-4 text-[#1a237e]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a237e]">
              {item.author?.firstName} {item.author?.lastName}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {item.role && <span>{item.role}</span>}
              {item.role && item.company && <span>·</span>}
              {item.company && (
                <span className="flex items-center gap-0.5">
                  <Building2 className="h-3 w-3" />
                  {item.company}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
