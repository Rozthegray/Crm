import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET, // <--- ADD THIS LINE
  session: { strategy: "jwt" }, 
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const user = await db.user.findUnique({
            where: { email: credentials.email as string }
          });

          if (!user || !user.password) {
            throw new Error("No account found with this email.");
          }

          // Block pending or suspended accounts
          if (user.status === "PENDING_APPROVAL") {
            throw new Error("Your account is pending HR approval.");
          }
          if (user.status === "SUSPENDED") {
            throw new Error("Your account has been suspended.");
          }

          // Compare passwords safely
          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!passwordsMatch) {
             throw new Error("Invalid email or password.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role, 
            branchId: user.branchId, 
          };
        } catch (error: any) {
          // This will pass the EXACT error message to your frontend instead of "Configuration"
          console.error("Auth Error:", error.message);
          throw new Error(error.message);
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as any;
        token.role = customUser.role;
        token.id = customUser.id;
        token.branchId = customUser.branchId; 
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.branchId = token.branchId as string;
      }
      return session;
    }
  }
});
