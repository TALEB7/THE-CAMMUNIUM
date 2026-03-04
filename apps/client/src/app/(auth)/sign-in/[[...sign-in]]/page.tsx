import Link from 'next/link';

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  !!clerkKey && clerkKey !== 'pk_test_placeholder' && clerkKey.startsWith('pk_');

export default async function SignInPage() {
  if (isClerkConfigured) {
    const { SignIn } = await import('@clerk/nextjs');
    return (
      <div className="flex flex-col items-center">
        <h1 className="mb-6 text-2xl font-bold text-[#1a237e] font-heading">
          Bienvenue sur The Communium
        </h1>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-lg rounded-xl border border-[#c9a730]/30',
              headerTitle: 'text-[#1a237e]',
              headerSubtitle: 'text-gray-600',
              formButtonPrimary: 'bg-[#1a237e] hover:bg-[#0d1642]',
              footerActionLink: 'text-[#c9a730] hover:text-[#b8922a]',
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-6 text-2xl font-bold text-[#1a237e] font-heading">
        Bienvenue sur The Communium
      </h1>
      <div className="ygo-card w-full rounded-xl border bg-white p-8 shadow-lg">
        <p className="mb-4 text-center text-sm text-gray-500">
          Clerk n&apos;est pas configuré. Ajoutez vos clés Clerk dans .env.local pour activer l&apos;authentification.
        </p>
        <Link
          href="/dashboard"
          className="ygo-btn-blue block w-full px-4 py-3 text-center text-sm font-medium"
        >
          Continuer en mode démo
        </Link>
      </div>
    </div>
  );
}
