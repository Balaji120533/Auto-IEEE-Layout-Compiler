-- Auth.js (NextAuth v5) Postgres adapter schema.
-- Run this once against your Neon/Vercel Postgres database before first use:
--   psql "$DATABASE_URL" -f src/lib/db/schema.sql
-- Column names/casing must match @auth/pg-adapter's queries exactly (it
-- queries "emailVerified", "userId", etc. as quoted mixed-case identifiers).

CREATE TABLE IF NOT EXISTS verification_token
(
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS accounts
(
  id SERIAL,
  "userId" UUID NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,

  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions
(
  id SERIAL,
  "userId" UUID NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,

  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users
(
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  -- Not part of the standard Auth.js schema: only set for email/password
  -- accounts (bcrypt hash). NULL for Google-only accounts.
  password_hash TEXT,

  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts ("userId");
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS sessions_session_token_idx ON sessions ("sessionToken");
