import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";


export async function auth() {
  const session = await getServerSession(authOptions);
  
  return {
    userId: session?.user ? (session.user as any).id : null,
    sessionId: session ? "session_123" : null,
    // Add other properties you might need
  };
}


export async function currentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) return null;
  
  return {
    id: (session.user as any).id,
    firstName: (session.user as any).firstName || session.user.name?.split(" ")[0],
    lastName: (session.user as any).lastName || session.user.name?.split(" ")[1],
    emailAddresses: [{ emailAddress: session.user.email }],
    primaryEmailAddress: { emailAddress: session.user.email },
    imageUrl: session.user.image || "",
  };
}
