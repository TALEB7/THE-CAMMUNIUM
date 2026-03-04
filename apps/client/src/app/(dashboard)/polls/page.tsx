'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useT } from '@/lib/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, ArrowLeft, Plus, Check, Clock, Users, Lock, Eye,
  X, ChevronRight, Vote,
} from 'lucide-react';

type ViewMode = 'browse' | 'detail' | 'create';

export default function PollsPage() {
  const { t } = useT();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('browse');
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  // ── Form state ──
  const [form, setForm] = useState({
    question: '',
    description: '',
    isMultiple: false,
    isAnonymous: false,
    endsAt: '',
    options: ['', ''],
  });

  // ── Queries ──
  const { data: pollsData } = useQuery({
    queryKey: ['polls', statusFilter],
    queryFn: () => api.get(`/polls?status=${statusFilter}&limit=50`).then(r => r.data),
  });

  const { data: pollDetail } = useQuery({
    queryKey: ['poll', selectedPoll],
    queryFn: () => api.get(`/polls/${selectedPoll}?userId=${userId}`).then(r => r.data),
    enabled: view === 'detail' && !!selectedPoll && !!userId,
  });

  // ── Mutations ──
  const createPoll = useMutation({
    mutationFn: (data: any) => api.post('/polls', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setView('browse');
      setForm({ question: '', description: '', isMultiple: false, isAnonymous: false, endsAt: '', options: ['', ''] });
    },
  });

  const voteMut = useMutation({
    mutationFn: (data: { pollId: string; optionId: string }) =>
      api.post(`/polls/${data.pollId}/vote`, { optionId: data.optionId, userId }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll', selectedPoll] });
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });

  const closePoll = useMutation({
    mutationFn: (id: string) => api.patch(`/polls/${id}/close`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      queryClient.invalidateQueries({ queryKey: ['poll'] });
    },
  });

  const polls = pollsData?.polls || [];

  // ── Create view ──
  if (view === 'create') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('browse')} className="p-2 hover:bg-[#1a237e]/10 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-[#1a237e]" />
          </button>
          <h1 className="text-2xl font-bold text-[#1a237e]">{t.polls.newPollTitle}</h1>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a237e] mb-1">{t.polls.question}</label>
              <input
                value={form.question}
                onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[#d4c088]/40 focus:ring-2 focus:ring-[#c9a730] focus:border-transparent"
                placeholder={t.polls.placeholderQuestion}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a237e] mb-1">{t.polls.pollDescription}</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-[#d4c088]/40 focus:ring-2 focus:ring-[#c9a730] focus:border-transparent"
                placeholder={t.polls.placeholderDesc}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a237e] mb-2">
                {t.polls.options} ({form.options.filter(o => o.trim()).length} / {form.options.length})
              </label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    value={opt}
                    onChange={e => {
                      const opts = [...form.options];
                      opts[i] = e.target.value;
                      setForm(p => ({ ...p, options: opts }));
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-[#d4c088]/40"
                    placeholder={`${t.polls.placeholderOption} ${i + 1}`}
                  />
                  {form.options.length > 2 && (
                    <button
                      onClick={() => setForm(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {form.options.length < 8 && (
                <button
                  onClick={() => setForm(p => ({ ...p, options: [...p.options, ''] }))}
                  className="text-sm text-[#c9a730] font-medium hover:underline"
                >
                  {t.polls.addOption}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isMultiple}
                  onChange={e => setForm(p => ({ ...p, isMultiple: e.target.checked }))}
                  className="rounded border-[#d4c088]"
                />
                {t.polls.multipleChoice}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={e => setForm(p => ({ ...p, isAnonymous: e.target.checked }))}
                  className="rounded border-[#d4c088]"
                />
                {t.polls.anonymous}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a237e] mb-1">{t.polls.endDate}</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={e => setForm(p => ({ ...p, endsAt: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-[#d4c088]/40"
              />
            </div>

            <button
              onClick={() => {
                const validOptions = form.options.filter(o => o.trim());
                if (!form.question.trim() || validOptions.length < 2) return;
                createPoll.mutate({
                  authorId: userId,
                  question: form.question,
                  description: form.description || undefined,
                  isMultiple: form.isMultiple,
                  isAnonymous: form.isAnonymous,
                  endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
                  options: validOptions.map((text, i) => ({ text, sortOrder: i })),
                });
              }}
              disabled={createPoll.isPending || !form.question.trim() || form.options.filter(o => o.trim()).length < 2}
              className="w-full py-3 bg-gradient-to-r from-[#1a237e] to-[#3949ab] text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50"
            >
              {createPoll.isPending ? t.polls.creating : t.polls.createPoll}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Detail view ──
  if (view === 'detail' && pollDetail) {
    const totalVotes = pollDetail.totalVotes || 0;
    const userVoted = pollDetail.userVoted;
    const isClosed = pollDetail.status === 'CLOSED';
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('browse')} className="p-2 hover:bg-[#1a237e]/10 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-[#1a237e]" />
          </button>
          <h1 className="text-2xl font-bold text-[#1a237e]">{t.polls.results}</h1>
        </div>

        <Card className="border-t-4 border-t-[#c9a730]">
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#1a237e]">{pollDetail.question}</h2>
              {pollDetail.description && <p className="mt-1 text-gray-600">{pollDetail.description}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={isClosed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}>
                {isClosed ? t.polls.ended : t.common.active}
              </Badge>
              {pollDetail.isMultiple && <Badge variant="outline">{t.polls.multipleChoice}</Badge>}
              {pollDetail.isAnonymous && (
                <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> {t.polls.anonymous}
              </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {totalVotes} {t.common.votes}
              </Badge>
            </div>

            {/* Options / results */}
            <div className="space-y-3">
              {(pollDetail.options || []).map((opt: any) => {
                const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                const canVote = !isClosed && !userVoted;
                return (
                  <div key={opt.id}>
                    <button
                      onClick={() => canVote && voteMut.mutate({ pollId: pollDetail.id, optionId: opt.id })}
                      disabled={!canVote || voteMut.isPending}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        canVote ? 'hover:border-[#c9a730] hover:bg-[#faf6e9] cursor-pointer' : 'cursor-default'
                      } ${opt.isUserVote ? 'border-[#c9a730] bg-[#faf6e9]' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[#1a237e] flex items-center gap-2">
                          {opt.isUserVote && <Check className="w-4 h-4 text-[#c9a730]" />}
                          {opt.text}
                        </span>
                        <span className="text-sm font-bold" style={{ color: pct > 50 ? '#c9a730' : '#666' }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#c9a730] to-[#e6c200] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{opt.voteCount} {t.common.votes}</p>
                    </button>
                  </div>
                );
              })}
            </div>

            {pollDetail.authorId === userId && !isClosed && (
              <button
                onClick={() => closePoll.mutate(pollDetail.id)}
                className="w-full py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100"
              >
                {t.polls.closePoll}
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Browse view ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-[#c9a730]" />
          <div>
            <h1 className="text-2xl font-bold text-[#1a237e]">{t.polls.title}</h1>
            <p className="text-sm text-gray-500">{t.polls.description}</p>
          </div>
        </div>
        <button
          onClick={() => setView('create')}
          className="px-4 py-2 bg-gradient-to-r from-[#1a237e] to-[#3949ab] text-white font-semibold rounded-lg hover:shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t.polls.newPoll}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['ACTIVE', 'CLOSED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              statusFilter === s
                ? 'bg-[#1a237e] text-white'
                : 'bg-white text-[#1a237e] border border-[#d4c088]/40 hover:bg-[#faf6e9]'
            }`}
          >
            {s === 'ACTIVE' ? t.polls.activeFilter : t.polls.endedFilter}
          </button>
        ))}
      </div>

      {/* Polls list */}
      <div className="space-y-4">
        {(polls as any[]).map((poll: any) => (
          <Card
            key={poll.id}
            className="cursor-pointer hover:shadow-lg hover:border-[#c9a730]/40 transition-all"
            onClick={() => { setSelectedPoll(poll.id); setView('detail'); }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#1a237e]">{poll.question}</h3>
                  {poll.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{poll.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Users className="w-3 h-3" /> {poll.totalVotes || 0} {t.common.votes}
                    </Badge>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {poll.options?.length || 0} {t.polls.options}
                    </Badge>
                    {poll.isAnonymous && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {t.polls.anonymous}
                      </Badge>
                    )}
                    {poll.endsAt && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(poll.endsAt).toLocaleDateString('fr-FR')}
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
        {(polls as any[]).length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg">{t.polls.noPolls}</p>
          </div>
        )}
      </div>
    </div>
  );
}
