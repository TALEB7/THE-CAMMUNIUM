'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  UserCheck,
  UserX,
  Users,
  Loader2,
  Check,
  X,
  Clock,
  Ban,
  Sparkles,
  Send,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

type Tab = 'connections' | 'pending' | 'sent' | 'suggestions';

export default function ConnectionsPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('connections');

  const { t } = useT();

  // Connections
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['connections', userId],
    queryFn: () => api.get(`/connections/${userId}`).then((r) => r.data),
    enabled: tab === 'connections' && !!userId,
  });

  // Pending requests
  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['connections-pending', userId],
    queryFn: () => api.get(`/connections/${userId}/pending`).then((r) => r.data),
    enabled: tab === 'pending' && !!userId,
  });

  // Sent requests
  const { data: sent, isLoading: sentLoading } = useQuery({
    queryKey: ['connections-sent', userId],
    queryFn: () => api.get(`/connections/${userId}/sent`).then((r) => r.data),
    enabled: tab === 'sent' && !!userId,
  });

  // Suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['connections-suggestions', userId],
    queryFn: () => api.get(`/connections/${userId}/suggestions`).then((r) => r.data),
    enabled: tab === 'suggestions' && !!userId,
  });

  // Count
  const { data: countData } = useQuery({
    queryKey: ['connections-count', userId],
    queryFn: () => api.get(`/connections/${userId}/count`).then((r) => r.data),
    enabled: !!userId,
  });

  // Send request
  const sendMutation = useMutation({
    mutationFn: (toUserId: string) => api.post('/connections/request', { fromUserId: userId, toUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['connections-sent'] });
    },
  });

  // Respond (accept/reject)
  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.patch(`/connections/${id}/respond`, { action, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections-pending'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['connections-count'] });
    },
  });

  // Cancel
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/connections/${id}/cancel`, { data: { userId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections-sent'] }),
  });

  // Remove
  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/connections/${id}`, { data: { userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['connections-count'] });
    },
  });

  const tabs = [
    { key: 'connections' as Tab, label: 'Connexions', icon: Users, count: countData?.count },
    { key: 'pending' as Tab, label: 'Reçues', icon: Clock, count: pending?.length },
    { key: 'sent' as Tab, label: 'Envoyées', icon: Send, count: sent?.length },
    { key: 'suggestions' as Tab, label: 'Suggestions', icon: Sparkles },
  ];

  const renderUser = (user: any) => (
    <div className="flex items-center gap-3">
      <img
        src={user?.avatarUrl || '/default-avatar.png'}
        alt=""
        className="w-11 h-11 rounded-full border-2 border-[#d4c088]/40 object-cover"
      />
      <div>
        <p className="text-sm font-semibold text-[#1a237e]">{user?.firstName} {user?.lastName}</p>
        {user?.bio && <p className="text-xs text-gray-500 line-clamp-1">{user.bio}</p>}
        {user?.city && <p className="text-xs text-gray-400">{user.city}</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a237e] font-heading">🤝 {t.connections.title}</h1>
        <p className="text-sm text-gray-500">{t.connections.description}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition ${
                tab === tabItem.key ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tabItem.label}
              {tabItem.count !== undefined && tabItem.count > 0 && (
                <Badge className="bg-[#c9a730] text-white text-[10px] px-1.5 py-0 ml-1">{tabItem.count}</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* CONNECTIONS */}
      {tab === 'connections' && (
        <div className="space-y-2">
          {connectionsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
          ) : !connections?.length ? (
            <Card className="border-[#d4c088]/40">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Pas encore de connexions</h3>
                <p className="text-sm text-gray-400 mt-1">Explorez les suggestions pour agrandir votre réseau</p>
              </CardContent>
            </Card>
          ) : (
            connections.map((conn: any) => (
              <Card key={conn.id} className="border-[#d4c088]/40">
                <CardContent className="p-4 flex items-center justify-between">
                  {renderUser(conn.other)}
                  <button
                    onClick={() => removeMutation.mutate(conn.id)}
                    disabled={removeMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    <UserX className="h-3 w-3" />
                    Retirer
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* PENDING */}
      {tab === 'pending' && (
        <div className="space-y-2">
          {pendingLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
          ) : !pending?.length ? (
            <Card className="border-[#d4c088]/40">
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Aucune demande reçue</h3>
              </CardContent>
            </Card>
          ) : (
            pending.map((conn: any) => (
              <Card key={conn.id} className="border-[#d4c088]/40">
                <CardContent className="p-4 flex items-center justify-between">
                  {renderUser(conn.fromUser)}
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondMutation.mutate({ id: conn.id, action: 'accept' })}
                      disabled={respondMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#c9a730] text-white rounded-lg hover:bg-[#b8962c] transition"
                    >
                      <Check className="h-3 w-3" />
                      Accepter
                    </button>
                    <button
                      onClick={() => respondMutation.mutate({ id: conn.id, action: 'reject' })}
                      disabled={respondMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <X className="h-3 w-3" />
                      Refuser
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* SENT */}
      {tab === 'sent' && (
        <div className="space-y-2">
          {sentLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
          ) : !sent?.length ? (
            <Card className="border-[#d4c088]/40">
              <CardContent className="p-12 text-center">
                <Send className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Aucune demande envoyée</h3>
              </CardContent>
            </Card>
          ) : (
            sent.map((conn: any) => (
              <Card key={conn.id} className="border-[#d4c088]/40">
                <CardContent className="p-4 flex items-center justify-between">
                  {renderUser(conn.toUser)}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">En attente</Badge>
                    <button
                      onClick={() => cancelMutation.mutate(conn.id)}
                      disabled={cancelMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <X className="h-3 w-3" />
                      Annuler
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* SUGGESTIONS */}
      {tab === 'suggestions' && (
        <div className="space-y-2">
          {suggestionsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
          ) : !suggestions?.length ? (
            <Card className="border-[#d4c088]/40">
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Aucune suggestion</h3>
                <p className="text-sm text-gray-400 mt-1">Revenez plus tard pour de nouvelles suggestions</p>
              </CardContent>
            </Card>
          ) : (
            suggestions.map((user: any) => (
              <Card key={user.id} className="border-[#d4c088]/40">
                <CardContent className="p-4 flex items-center justify-between">
                  {renderUser(user)}
                  <button
                    onClick={() => sendMutation.mutate(user.clerkId)}
                    disabled={sendMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] disabled:opacity-50 transition"
                  >
                    {sendMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                    Se connecter
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
