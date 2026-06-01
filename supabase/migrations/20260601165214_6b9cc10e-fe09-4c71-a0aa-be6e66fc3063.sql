
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prayer_mosques jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS azan_sound text NOT NULL DEFAULT 'classic';
