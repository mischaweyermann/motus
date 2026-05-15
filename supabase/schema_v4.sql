-- Run this in the Supabase SQL Editor (after schema_v3.sql)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_color TEXT NOT NULL DEFAULT '#1F1F1F',
  ADD COLUMN IF NOT EXISTS weekly_goal  INTEGER NOT NULL DEFAULT 4;
