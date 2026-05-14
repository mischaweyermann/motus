-- ─────────────────────────────────────────────
-- Motus · Supabase Schema
-- SQL Editor in deinem Supabase-Dashboard ausführen
-- ─────────────────────────────────────────────

-- 1. Profile-Tabelle (erweiter auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigenes Profil lesen"    ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Eigenes Profil anlegen"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Eigenes Profil updaten"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Profil automatisch bei Registrierung anlegen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Motus User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Workout-Sessions-Tabelle
CREATE TABLE IF NOT EXISTS workout_sessions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT        NOT NULL,
  type         TEXT        NOT NULL DEFAULT 'Gym',
  duration     INTEGER,             -- Minuten
  kcal         INTEGER,
  exercises    INTEGER,             -- Anzahl Übungen
  notes        TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigene Sessions verwalten" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id);
