import { Pool } from '@neondatabase/serverless';

// One pool per server process. Next.js reuses modules across requests in the
// same runtime, so this is safe to create at module scope instead of per-request.
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — see frontend/.env.local.example');
  }
  return new Pool({ connectionString });
}

export const pool = global._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') global._pgPool = pool;
