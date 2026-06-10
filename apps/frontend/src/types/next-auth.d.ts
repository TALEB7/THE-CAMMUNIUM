import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      firstName?: string;
      lastName?: string;
      accountType?: "personal" | "business" | "company_creation";
      phone?: string;
      avatarUrl?: string;
      accessToken?: string;
    };
  }

  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    accountType?: "personal" | "business" | "company_creation";
    phone?: string;
    avatarUrl?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string;
    lastName?: string;
    accountType?: string;
    phone?: string;
    avatarUrl?: string;
    accessToken?: string;
  }
}
