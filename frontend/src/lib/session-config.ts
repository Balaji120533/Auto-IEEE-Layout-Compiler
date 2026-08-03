/**
 * Session timing, shared between the Auth.js config (server) and the idle
 * timeout UI (client). Kept in its own module so the client bundle never has
 * to import auth.config.ts, which pulls in server-only Auth.js types.
 */

/** Idle timeout in seconds — how long a session survives without activity. */
export const SESSION_MAX_AGE = 30 * 60; // 30 minutes

/** How often an active session's token is rewritten server-side. */
export const SESSION_UPDATE_AGE = 5 * 60; // 5 minutes
