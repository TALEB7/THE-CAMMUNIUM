'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Lock, Crown, LogOut, LogIn, Loader2, Video } from 'lucide-react';
import type { Group } from '@/types';
import { useT } from '@/lib/i18n';

interface Props {
  group: Group;
  userId: string;
  isMember: boolean;
  isOwner: boolean;
  activeMeeting?: { id: string } | null;
  isJoining: boolean;
  isLeaving: boolean;
  isStartingMeeting: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onJoinMeeting: (id: string) => void;
  onStartMeeting: () => void;
}

export function GroupHeader({
  group, isMember, isOwner, activeMeeting,
  isJoining, isLeaving, isStartingMeeting,
  onJoin, onLeave, onJoinMeeting, onStartMeeting,
}: Props) {
  const { t } = useT();

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-2xl shrink-0">
            {group.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-primary">{group.name}</h1>
              {!group.isPublic && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {t.groups.privateLabel}
                </Badge>
              )}
            </div>
            {group.description && <p className="text-sm text-muted-foreground mt-1">{group.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {group._count?.members ?? group.memberCount} {t.groups.members}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {group._count?.posts ?? group.postCount} {t.groups.posts}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {isOwner ? (
              <Badge className="bg-[#C8102E]/10 text-primary border-primary/20 flex items-center gap-1">
                <Crown className="h-3 w-3" />
                {t.groups.owner}
              </Badge>
            ) : isMember ? (
              <button
                onClick={onLeave}
                disabled={isLeaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-destructive/10 disabled:opacity-50 transition"
              >
                <LogOut className="h-3 w-3" />
                {t.groups.leave}
              </button>
            ) : (
              <button
                onClick={onJoin}
                disabled={isJoining}
                className="ygo-btn-gold disabled:opacity-50"
              >
                {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {t.groups.join}
              </button>
            )}
          </div>
        </div>

        {isMember && (
          <div className="mt-4 pt-4 border-t border-border">
            {activeMeeting ? (
              <button
                onClick={() => onJoinMeeting(activeMeeting.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition animate-pulse"
              >
                <Video className="h-4 w-4" />
                {t.groups.joinMeeting}
              </button>
            ) : (
              <button
                onClick={onStartMeeting}
                disabled={isStartingMeeting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:brightness-110 disabled:opacity-50 transition"
              >
                {isStartingMeeting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                {t.groups.startMeeting}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
