
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiet_hours_start time,
  ADD COLUMN IF NOT EXISTS quiet_hours_end time,
  ADD COLUMN IF NOT EXISTS alert_lead_minutes integer NOT NULL DEFAULT 5;
