-- Run this in the Supabase SQL Editor (after schema_v2.sql)

-- Planned workouts table
CREATE TABLE IF NOT EXISTS planned_workouts (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           TEXT        NOT NULL,
  type           TEXT        NOT NULL DEFAULT 'Gym',
  scheduled_date DATE        NOT NULL,
  scheduled_time TIME,
  duration       INTEGER,
  notes          TEXT,
  completed      BOOLEAN     DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigene Planungen verwalten" ON planned_workouts
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS planned_workouts_user_date
  ON planned_workouts(user_id, scheduled_date);
