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

-- WildDex daily streak tracking
-- Run this manually in the Supabase dashboard: SQL Editor → paste → Run.
-- Do not run this from application code.
--
-- Tracks each user's daily catch streak (current + longest), maintained by
-- lib/streaks.ts whenever a catch is saved. `last_catch_date` is a date-only
-- column (no time) so we can compare "did they catch something today /
-- yesterday" with simple string equality instead of timestamp math.
--
-- KNOWN SIMPLIFICATION: the "today"/"yesterday" comparison uses the device's
-- local date, not UTC. A user traveling across timezones right around
-- midnight could see the streak behave oddly (e.g. miss a day it shouldn't,
-- or not miss one it should). This is acceptable for an MVP and not something
-- to fix in this task.
create table if not exists user_streaks (
  user_id text primary key,          -- Firebase UID, stored as plain text (same convention as catches.user_id)
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_catch_date date,              -- date only, no time, for day-comparison
  updated_at timestamptz not null default now()
);

-- RLS is intentionally OFF here too, for the same reasons documented above
-- for `catches` — this is a dev-only simplification, not safe for production.

-- WildDex catch location (GPS coordinates)
-- Run this manually in the Supabase dashboard: SQL Editor → paste → Run.
-- Do not run this from application code.
--
-- Foundation for future GPS territory/trading features (not built yet — this
-- session only captures and stores the coordinates). Both columns are
-- NULLABLE on purpose: if the user denies location permission or a fix is
-- unavailable/times out, we still want the catch itself to save successfully
-- (species/XP/streak matter more than location), just without coordinates for
-- that row.
alter table catches add column if not exists latitude numeric;
alter table catches add column if not exists longitude numeric;
