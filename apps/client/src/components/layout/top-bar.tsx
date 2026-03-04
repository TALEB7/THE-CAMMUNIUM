'use client';

import { Bell, Search, User } from 'lucide-react';

let useUser: () => { user: any } = () => ({ user: null });
let UserButton: React.ComponentType<any> = () => null;

try {
  // Only load Clerk hooks if the provider is available
  const clerk = require('@clerk/nextjs');
  if (
    typeof window !== 'undefined' ||
    (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder' &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_'))
  ) {
    useUser = clerk.useUser;
    UserButton = clerk.UserButton;
  }
} catch {
  // Clerk not available
}

export function TopBar() {
  let user: any = null;
  try {
    const result = useUser();
    user = result?.user;
  } catch {
    // Clerk not configured
  }

  return (
    <header className="flex items-center justify-between border-b-2 border-[#c9a730]/30 bg-white px-6 py-3">
      {/* Search */}
      <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-[#c9a730]/40 bg-[#f8f6f0] px-3 py-2">
        <Search className="h-4 w-4 text-[#c9a730]" />
        <input
          type="text"
          placeholder="Rechercher des professionnels, entreprises, annonces..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName ?? 'Demo'} {user?.lastName ?? 'User'}
            </p>
            <p className="text-xs text-gray-500">{user?.primaryEmailAddress?.emailAddress ?? 'demo@communium.ma'}</p>
          </div>
          {user ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#c9a730] bg-[#fff8e1]">
              <User className="h-4 w-4 text-[#1a237e]" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
