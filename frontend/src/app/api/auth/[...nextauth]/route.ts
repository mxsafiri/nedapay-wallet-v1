import NextAuth, { DefaultSession, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { rateLimit } from '@/lib/utils/rate-limit';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: {
      id: string;
      role?: string;
      email?: string;
    } & DefaultSession['user']
  }

  interface User {
    id: string;
    role?: string;
    email: string;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          await rateLimit.check(req.headers?.['x-real-ip'] as string || 'unknown', 5, '1m');
        } catch {
          throw new Error('Too many requests');
        }

        const isValidCredentials = 
          credentials.email === process.env.ADMIN_USERNAME &&
          credentials.password === process.env.ADMIN_PASSWORD;

        if (isValidCredentials) {
          return {
            id: '1',
            email: credentials.email,
            role: 'admin'
          };
        }

        throw new Error('Invalid credentials');
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  }
});

export { handler as GET, handler as POST };
