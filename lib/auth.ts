import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const providers: NextAuthOptions["providers"] = [];
const resolvedSecret = process.env.NEXTAUTH_SECRET ?? "stratum-local-demo-secret";

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Demo account",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;
      if (email !== "demo@stratum.app" || password !== "stratum2026") {
        return null;
      }

      return {
        id: "stratum-demo",
        email: "demo@stratum.app",
        name: "STRATUM Demo"
      };
    }
  })
);

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt"
  },
  secret: resolvedSecret,
  pages: {
    signIn: "/signin",
    error: "/signin"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.plan_type = "realtor";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = session.user.name ?? token.name ?? "STRATUM Operator";
      }
      return {
        ...session,
        plan_type: token.plan_type ?? "realtor"
      };
    }
  }
};

export async function getDashboardSession() {
  if (!process.env.NEXTAUTH_SECRET) {
    return {
      user: {
        name: "Demo Operator",
        email: "operator@stratum.local"
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
      plan_type: "realtor"
    };
  }

  const session = await getServerSession(authOptions);
  if (session) return session;
  return null;
}
