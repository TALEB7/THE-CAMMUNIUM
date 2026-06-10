'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getMediaUrl } from '@/lib/media-url';

export function UserProfileCard() {
  const { user } = useUser();
  const [imgFailed, setImgFailed] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['my-profile-avatar', user?.id],
    queryFn: () => api.get('/profiles/me').then((r) => r.data),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const firstName = user?.firstName ?? 'Demo';
  const lastName  = user?.lastName  ?? 'User';
  const fullName  = `${firstName} ${lastName}`;
  const memberId  = user?.id ? `#${user.id.slice(-6).toUpperCase()}` : '#COM-001';

  const avatarSrc =
    profile?.avatarUrl                 ||
    profile?.personalProfile?.photoUrl ||
    profile?.businessProfile?.logoUrl  ||
    (user as any)?.avatarUrl           ||
    null;

  const resolvedUrl = getMediaUrl(avatarSrc);

  return (
    <Link
      href="/profile"
      className="flex items-center gap-3 rounded-lg border-2 border-primary/40 dark:border-[#333] bg-card dark:bg-[#121212] px-3 py-2 shadow-sm hover:border-primary dark:hover:border-[#555] hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(160,160,160,0.15)] transition-all cursor-pointer"
    >
      {/* Avatar */}
      <div className="avatar-glow h-9 w-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center">
        {resolvedUrl && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedUrl}
            alt={fullName}
            className="h-full w-full object-cover rounded-full"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <User className="h-5 w-5 text-primary dark:text-[#b0b0b0]" />
        )}
      </div>

      {/* Name & ID */}
      <div className="hidden sm:block leading-tight">
        <p className="text-sm font-bold text-foreground font-heading truncate max-w-[120px]">
          {fullName}
        </p>
        <p className="text-[10px] font-medium text-primary dark:text-[#808080] tracking-wider">
          {memberId}
        </p>
      </div>
    </Link>
  );
}
