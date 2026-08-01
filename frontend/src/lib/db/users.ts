import { pool } from './pool';

export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  password_hash: string | null;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
  return result.rows[0] ?? null;
}

/** Creates a new email/password user. Throws if the email is already taken
 * (relies on the unique index in schema.sql rather than a pre-check, to
 * avoid a race between the check and the insert). */
export async function createUserWithPassword(email: string, name: string, passwordHash: string): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     RETURNING id, name, email, password_hash`,
    [name, email, passwordHash],
  );
  return result.rows[0];
}
