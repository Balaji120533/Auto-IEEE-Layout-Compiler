import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe subset of the Auth.js config — no adapter (pg), no Credentials
 * provider (pulls in bcryptjs, which needs Node's crypto). Middleware runs
 * on the Edge runtime by default, so this is the only config it can import;
 * `authorized()` only inspects the JWT already attached to the request, it
 * never touches the database. The full config (auth.ts) extends this with
 * the adapter and providers for use everywhere else (route handlers, server
 * components), which do run on Node.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [], // populated by auth.ts
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
};
