import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET environment variable is not set");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "vous@exemple.com" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            return null; // Login failed
          }

            const data = await res.json();
            // The backend returns { user: { id, email, firstName, lastName, accountType, phone, avatarUrl }, token }

            if (data && data.user && data.token) {
              let kycStatus = "none";
              try {
                const { prisma } = await import("@/lib/prisma");
                const kyc = await prisma.kyc.findUnique({ where: { userId: data.user.id } });
                if (kyc) kycStatus = kyc.status;
              } catch (e) {
                // fallback if database is not reachable at login
              }

              return {
                id: data.user.id,
                name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || 'User',
                email: data.user.email,
                image: data.user.avatarUrl || "",
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                accountType: data.user.accountType,
                phone: data.user.phone,
                avatarUrl: data.user.avatarUrl,
                role: data.user.role,
                accessToken: data.token,
                kycStatus,
              };
            }
            return null;
          } catch (error) {
            console.error("Login Error:", error);
            return null;
          }
        },
      }),
    ],
    pages: {
      signIn: "/sign-in",
    },
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async jwt({ token, user, trigger, session }) {
        if (user) {
          token.id = user.id;
          token.firstName = (user as any).firstName;
          token.lastName = (user as any).lastName;
          token.accountType = (user as any).accountType;
          token.phone = (user as any).phone;
          token.avatarUrl = (user as any).avatarUrl;
          token.role = (user as any).role;
          token.accessToken = (user as any).accessToken;
          token.kycStatus = (user as any).kycStatus || "none";
        }
        if (trigger === "update" && session?.kycStatus) {
          token.kycStatus = session.kycStatus;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).id = token.id;
          (session.user as any).firstName = token.firstName;
          (session.user as any).lastName = token.lastName;
          (session.user as any).accountType = token.accountType;
          (session.user as any).phone = token.phone;
          (session.user as any).avatarUrl = token.avatarUrl;
          (session.user as any).role = token.role;
          (session.user as any).accessToken = token.accessToken;
          (session.user as any).kycStatus = token.kycStatus;
        }
        return session;
      },
    },
  secret: process.env.NEXTAUTH_SECRET,
};
