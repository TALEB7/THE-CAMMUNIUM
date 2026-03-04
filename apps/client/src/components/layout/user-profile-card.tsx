'use client';

import { User } from 'lucide-react';
import Link from 'next/link';

let useUser: () => { user: any; isLoaded: boolean } = () => ({ user: null, isLoaded: false });

try {
  const clerk = require('@clerk/nextjs');
  if (
    typeof window !== 'undefined' ||
    (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder' &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_'))
  ) {
    useUser = clerk.useUser;
  }
} catch {
  // Clerk not available
}

export function UserProfileCard() {
  let user: any = null;
  try {
    const result = useUser();
    user = result?.user;
  } catch {
    // Clerk not configured
  }

  const firstName = user?.firstName ?? 'Demo';
  const lastName = user?.lastName ?? 'User';
  const fullName = `${firstName} ${lastName}`;
  const memberId = user?.id ? `#${user.id.slice(-6).toUpperCase()}` : '#COM-001';

  return (
    <Link href="/profile" className="flex items-center gap-3 rounded-lg border-2 border-[#c9a730]/50 bg-white px-3 py-2 shadow-sm hover:border-[#c9a730] hover:shadow-md transition-all cursor-pointer">
      {/* Avatar */}
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border-2 border-[#c9a730] bg-gradient-to-br from-[#f5f0e1] to-[#e8e0c8]">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-[#1a237e]" />
        )}
      </div>

      {/* Name & ID */}
      <div className="hidden sm:block leading-tight">
        <p className="text-sm font-bold text-[#1a237e] font-heading truncate max-w-[120px]">
          {fullName}
        </p>
        <p className="text-[10px] font-medium text-[#c9a730] tracking-wider">
          {memberId}
        </p>
      </div>
    </Link>
  );
}
