import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';

const authConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    CredentialProvider({
      credentials: {
        username: { type: 'text' },
        email: { type: 'email' },
        userId: { type: 'text' },
        password: { type: 'password' }
      },
      async authorize(credentials) {
        const user = {
          id: credentials?.userId as string,
          name: credentials?.username as string,
          email: credentials?.email as string
        };
        return user || null;
      }
    })
  ],
  pages: {
    signIn: '/'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.name = token.name;
      session.user.email = token.email as string;
      session.user.id = token.id as string;
      return session;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;
