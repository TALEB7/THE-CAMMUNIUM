import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET environment variable is not set");
}

const protectedPrefixes = ["/feed", "/profile", "/marketplace", "/documents", "/messages"];

export default withAuth(async (req) => {
  const { pathname } = req.nextUrl;
  const token = req.nextauth.token;

  if (protectedPrefixes.some(p => pathname.startsWith(p))) {
    const accountType = (token as any)?.accountType;
    const kycStatus = (token as any)?.kycStatus || 'none';

    // Le KYB (vérification entreprise) est obligatoire avant l'accès à la plateforme.
    // Le KYC personnel reste facultatif à ce stade : un compte personnel sans dossier
    // KYC ('none') n'est pas bloqué, sinon tous les comptes personnels resteraient
    // bloqués indéfiniment puisque l'onboarding ne crée pas de dossier KYC pour eux.
    if (accountType === 'business' && kycStatus !== 'approved') {
      const url = req.nextUrl.clone();
      url.pathname = '/onboarding/verify/pending';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}, {
  pages: {
    signIn: "/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|onboarding|.*\\..*|$).*)"
  ],
};