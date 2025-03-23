import NextAuth, { NextAuthOptions, User, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface User {
    role?: string;
  }
  interface Session extends DefaultSession {
    user?: User & {
      role?: string;
    };
  }
}

const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const isValidUsername = credentials.username === process.env.ADMIN_USERNAME;
        const isValidPassword = credentials.password === process.env.ADMIN_PASSWORD;

        if (isValidUsername && isValidPassword) {
          return {
            id: '1',
            email: process.env.ADMIN_USERNAME,
            name: 'Admin',
            role: 'admin'
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
