'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import SessionTimeout from './SessionTimeout';

/**
 * `session` is resolved on the server and passed in, so the provider starts
 * with the user already populated instead of fetching /api/auth/session on
 * mount. Besides removing a request from first paint, this makes the session
 * survive React tree remounts — in dev, a Fast Refresh (especially after a
 * syntax error) resets the provider's in-memory cache without triggering a
 * refetch, which would otherwise make `useSession()` read as signed-out until
 * a full page reload.
 */
export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      {children}
      {/* Renders nothing unless signed in and close to expiry. */}
      <SessionTimeout />
    </SessionProvider>
  );
}
