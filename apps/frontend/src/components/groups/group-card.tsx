'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Lock } from 'lucide-react';
import type { Group } from '@/types';
import { useT } from '@/lib/i18n';

interface Props {
  group: Group;
  onClick: () => void;
}

export function GroupCard({ group, onClick }: Props) {
  const { t } = useT();
  return (
    <button onClick={onClick} className="text-left w-full h-full">
      <Card className="border-border hover:border-primary transition h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
              {group.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-primary truncate">{group.name}</h3>
                {!group.isPublic && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
              {group.category && (
                <Badge variant="outline" className="text-[10px] border-[#C8102E] mt-0.5">{group.category}</Badge>
              )}
            </div>
          </div>
          {group.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {group._count?.members ?? group.memberCount} {t.groups.members}
            <span className="mx-1">·</span>
            <MessageCircle className="h-3 w-3" />
            {group._count?.posts ?? group.postCount} {t.groups.posts}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
