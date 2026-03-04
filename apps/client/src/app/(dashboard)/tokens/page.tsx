'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Sparkles,
  TrendingUp,
  History,
  Star,
} from 'lucide-react';

export default function TokensPage() {
  const { t } = useT();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [txPage, setTxPage] = useState(1);

  // Wallet balance
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['token-balance', userId],
    queryFn: () => api.get(`/tokens/balance?clerkId=${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  // Transaction history
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['token-transactions', userId, txPage],
    queryFn: () =>
      api.get(`/tokens/transactions?clerkId=${userId}&page=${txPage}&limit=15`).then((r) => r.data),
    enabled: !!userId,
  });

  // Daily reward
  const dailyMutation = useMutation({
    mutationFn: () => api.post('/tokens/daily-reward', { clerkId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-balance'] });
      queryClient.invalidateQueries({ queryKey: ['token-transactions'] });
    },
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const txLabels: Record<string, string> = {
    DAILY_REWARD: t.tokens.txDailyReward,
    REFERRAL: t.tokens.txReferral,
    PURCHASE: t.tokens.txPurchase,
    LISTING_BOOST: t.tokens.txListingBoost,
    PROFILE_BOOST: t.tokens.txProfileBoost,
    AUCTION_BID: t.tokens.txAuctionBid,
    PREMIUM_CONTENT: t.tokens.txPremiumContent,
    SIGNUP_BONUS: t.tokens.txSignupBonus,
    PROFILE_COMPLETE: t.tokens.txProfileComplete,
    FIRST_SALE: t.tokens.txFirstSale,
    ADMIN_CREDIT: t.tokens.txAdminCredit,
    ADMIN_DEBIT: t.tokens.txAdminDebit,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading tracking-wide flex items-center gap-2">
          <Coins className="h-7 w-7 text-[#c9a730]" />
          {t.tokens.title}
        </h1>
        <p className="text-gray-500">{t.tokens.description}</p>
        <div className="h-0.5 bg-gradient-to-r from-[#c9a730] via-[#e6c200] to-transparent max-w-[120px] mt-1" />
      </div>

      {/* Balance + Daily Reward */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#c9a730]/40 bg-gradient-to-br from-[#fff8e1] to-white md:col-span-2">
          <CardContent className="pt-6">
            {balanceLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#c9a730]" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.tokens.balanceAvailable}</p>
                  <p className="text-4xl font-extrabold text-[#1a237e] font-heading">
                    {balance?.balance?.toLocaleString('fr-FR') ?? 0}
                    <span className="text-lg text-[#c9a730] ml-2">Tks</span>
                  </p>
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      {t.tokens.totalEarned} {balance?.totalEarned?.toLocaleString('fr-FR') ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowDownLeft className="h-3.5 w-3.5 text-red-400" />
                      {t.tokens.totalSpent} {balance?.totalSpent?.toLocaleString('fr-FR') ?? 0}
                    </span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c9a730] to-[#e6c200] flex items-center justify-center">
                  <Star className="h-8 w-8 text-white" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#c9a730]/40">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full">
            <Gift className="h-10 w-10 text-[#c9a730] mb-2" />
            <p className="text-sm font-semibold text-[#1a237e] mb-1">{t.tokens.dailyReward}</p>
            <p className="text-xs text-gray-500 mb-3">{t.tokens.dailyRewardDesc}</p>
            <button
              onClick={() => dailyMutation.mutate()}
              disabled={dailyMutation.isPending}
              className="px-6 py-2.5 bg-gradient-to-r from-[#c9a730] to-[#e6c200] text-[#1a237e] font-bold text-sm rounded-lg hover:shadow-md transition-all disabled:opacity-50"
            >
              {dailyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : dailyMutation.isSuccess ? (
                <span className="flex items-center gap-1"><Sparkles className="h-4 w-4" /> {t.tokens.claimed}</span>
              ) : (
                t.tokens.claimReward
              )}
            </button>
            {dailyMutation.isError && (
              <p className="text-xs text-red-500 mt-2">{t.tokens.alreadyClaimed}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How to earn / spend */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-[#d4c088]/40">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1a237e] flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              {t.tokens.earnTks}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>{t.tokens.dailyLogin}</span><Badge variant="outline" className="text-[#c9a730]">+2</Badge></div>
            <div className="flex justify-between"><span>{t.tokens.completeProfile100}</span><Badge variant="outline" className="text-[#c9a730]">+20</Badge></div>
            <div className="flex justify-between"><span>{t.tokens.referMember}</span><Badge variant="outline" className="text-[#c9a730]">+25</Badge></div>
            <div className="flex justify-between"><span>{t.tokens.firstSale}</span><Badge variant="outline" className="text-[#c9a730]">+15</Badge></div>
            <div className="flex justify-between"><span>{t.tokens.badgeUnlocked}</span><Badge variant="outline" className="text-[#c9a730]">+5</Badge></div>
          </CardContent>
        </Card>

        <Card className="border-[#d4c088]/40">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1a237e] flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-red-400" />
              {t.tokens.spendTks}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>{t.tokens.boostListing}</span><Badge variant="outline" className="text-red-400">-10</Badge></div>
            <div className="flex justify-between"><span>{t.tokens.boostProfile}</span><Badge variant="outline" className="text-red-400">-15</Badge></div>
            <div className="flex justify-between"><span>{t.tokens.premiumContent}</span><Badge variant="outline" className="text-red-400">-5</Badge></div>
            <div className="flex justify-between"><span>{t.tokens.auction}</span><Badge variant="outline" className="text-red-400">{t.tokens.variable}</Badge></div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="border-[#d4c088]/40">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#1a237e] flex items-center gap-2">
            <History className="h-4 w-4" />
            {t.tokens.transactionHistory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#c9a730]" /></div>
          ) : !transactions?.data?.length ? (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">{t.tokens.noTransactions}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.data.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.amount > 0 ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {tx.amount > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {txLabels[tx.type] || tx.type}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} Tks
                    </span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {transactions.total > 15 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage <= 1}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-40"
                  >
                    {t.common.previous}
                  </button>
                  <span className="px-3 py-1.5 text-xs text-gray-500">
                    {t.common.page} {txPage} / {Math.ceil(transactions.total / 15)}
                  </span>
                  <button
                    onClick={() => setTxPage((p) => p + 1)}
                    disabled={txPage >= Math.ceil(transactions.total / 15)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-40"
                  >
                    {t.common.next}
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
