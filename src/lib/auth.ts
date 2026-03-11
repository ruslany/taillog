import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  pages: {
    signIn: '/',
  },
  callbacks: {
    signIn({ user }) {
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map((e) => e.trim()) ?? [];
      if (allowedEmails.length === 0) return true;
      return allowedEmails.includes(user.email ?? '');
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
