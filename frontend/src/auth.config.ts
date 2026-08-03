import type { NextAuthConfig } from 'next-auth';
import { SESSION_MAX_AGE, SESSION_UPDATE_AGE } from '@/lib/session-config';

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
  session: {
    strategy: 'jwt',
    // Auth.js re-issues the JWT on activity, so maxAge behaves as an IDLE
    // timeout rather than an absolute one: each refresh pushes the expiry out
    // by another 30 minutes. An unattended machine logs itself out; someone
    // actively writing is never interrupted.
    maxAge: SESSION_MAX_AGE,
    // How often an unchanged token is rewritten. Without this, Auth.js only
    // refreshes once per day by default, so an active user's token would still
    // hit maxAge and expire mid-session.
    updateAge: SESSION_UPDATE_AGE,
  },
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
