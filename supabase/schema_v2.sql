-- Run this in the Supabase SQL Editor (after schema.sql)

-- 1. Add source + external_id to workout_sessions
ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 2. Partial unique index to prevent duplicate Strava imports
CREATE UNIQUE INDEX IF NOT EXISTS workout_sessions_external_dedup
  ON workout_sessions(user_id, source, external_id)
  WHERE external_id IS NOT NULL;

-- 3. Integrations table (Strava, Garmin, etc.)
CREATE TABLE IF NOT EXISTS integrations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users NOT NULL,
  provider       TEXT NOT NULL,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT,
  token_expires_at TIMESTAMPTZ,
  provider_user_id TEXT,
  connected_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);
