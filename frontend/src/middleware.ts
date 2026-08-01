import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Uses the edge-safe config (no pg adapter, no bcrypt) — see auth.config.ts.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Gate only the editor — the landing page, login, and signup stay public.
  matcher: ['/editor/:path*'],
};
