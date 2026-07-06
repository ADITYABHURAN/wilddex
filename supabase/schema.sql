-- WildDex catches table
-- Run this manually in the Supabase dashboard: SQL Editor → paste → Run.
-- Do not run this from application code.

create table if not exists catches (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,           -- Firebase UID, stored as plain text
  species_id text not null,        -- matches id in data/species.ts
  confidence numeric,
  xp_earned integer not null,
  caught_at timestamptz not null default now()
);

create index if not exists catches_user_id_idx on catches (user_id);

-- NOTES (read before touching this file):
--
-- Why user_id is `text` and not a foreign key to auth.users:
--   This app uses Firebase Auth, not Supabase Auth, for sign-in. `user_id` holds
--   a Firebase UID (a string), which has no relationship to Supabase's own
--   `auth.users` table. There is intentionally no foreign key constraint here.
--
-- Row Level Security (RLS) — currently OFF:
--   This table has no RLS policies enabled, so any client holding the anon/public
--   key can read and write ANY row, for ANY user_id. The app currently talks to
--   Supabase directly from the client with the anon key, and since we're not
--   using Supabase Auth, there is no `auth.uid()` to check policies against —
--   Supabase has no way to verify that a request claiming user_id = X actually
--   came from the Firebase user X.
--
--   This is a KNOWN, ACCEPTED simplification for development only. It is NOT
--   safe for production: any user of the app could read or overwrite any other
--   user's catches by changing the user_id in a request.
--
--   The real fix (not implemented in this session): introduce a backend proxy
--   (e.g. a small Express endpoint) that verifies the Firebase ID token
--   server-side, then uses the Supabase service_role key (never exposed to the
--   client) to perform the write/read on the caller's behalf. Alternatively,
--   look into Supabase's support for third-party JWT verification so RLS
--   policies could check a verified Firebase UID directly. Either approach is
--   future work, not something to solve in this task.
