"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import React from "react";
import { getMediaUrl } from "@/lib/media-url";


export function useUser() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";

  const user = React.useMemo(() => {
    return session?.user ? {
      id: session.user.id,
      email: session.user.email as string,
      firstName: ((session.user as any).firstName || session.user.name?.split(" ")[0] || "") as string,
      lastName: ((session.user as any).lastName || session.user.name?.split(" ").slice(1).join(" ") || "") as string,
      accountType: (session.user as any).accountType as "personal" | "business" | "company_creation",
      phone: (session.user as any).phone as string,
      avatarUrl: (session.user as any).avatarUrl as string,
      role: (session.user as any).role as string,
    } : null;
  }, [session?.user]);

  return { isLoaded, isSignedIn: !!user, user };
}


export function useAuth() {
  const { data: session, status } = useSession();
  return {
    isLoaded: status !== "loading",
    userId: session?.user ? (session.user as any).id : null,
    sessionId: status === "authenticated" ? "session_123" : null,
    signOut: () => signOut({ callbackUrl: "/" }),
  };
}

// Wrapper for <SignedIn>
export function SignedIn({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  if (status === "authenticated") return <>{children}</>;
  return null;
}

// Wrapper for <SignedOut>
export function SignedOut({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  if (status !== "authenticated") return <>{children}</>;
  return null;
}

// Wrapper for <SignInButton>
export function SignInButton({ children, mode, ...props }: { children?: React.ReactNode; mode?: string;[key: string]: any }) {
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        if (children.props.onClick) children.props.onClick(e);
        // We'll just redirect to sign-in for now since we don't have a modal
        window.location.href = "/sign-in";
      }
    });
  }
  return (
    <Link href="/sign-in" className="inline-block">
      {children || <button>Se connecter</button>}
    </Link>
  );
}

// Wrapper for <SignUpButton>
export function SignUpButton({ children, mode, ...props }: { children?: React.ReactNode; mode?: string;[key: string]: any }) {
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        if (children.props.onClick) children.props.onClick(e);
        window.location.href = "/sign-up";
      }
    });
  }
  return (
    <Link href="/sign-up" className="inline-block">
      {children || <button>S'inscrire</button>}
    </Link>
  );
}

// Wrapper for <UserButton>
export function UserButton({ ...props }: { [key: string]: any }) {
  const { data: session } = useSession();
  const userInitials = session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : "U";

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold border border-primary/30 hover:bg-primary/30 transition-all"
        title="Voir mon profil"
      >
        {(session?.user?.image || (session?.user as any)?.avatarUrl) ? (
          <img src={getMediaUrl(session?.user?.image || (session?.user as any)?.avatarUrl) || ''} alt="User" className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="font-heading">{userInitials}</span>
        )}
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: props.afterSignOutUrl || "/" })}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors hidden sm:block"
      >
        Déconnexion
      </button>
    </div>
  );
}

// Fallback for UserProfile (Admin/Settings page)
export function UserProfile({ ...props }: { [key: string]: any }) {
  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <h3 className="font-semibold text-foreground mb-2">Profil Utilisateur</h3>
      <p className="text-sm text-muted-foreground mb-4">Gérez vos informations de profil ici.</p>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium"
      >
        Se déconnecter
      </button>
    </div>
  );
}
