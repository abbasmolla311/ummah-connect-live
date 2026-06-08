
CREATE TABLE IF NOT EXISTS public.prayer_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prayer text NOT NULL,
  fired_for date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, prayer, fired_for)
);

GRANT SELECT ON public.prayer_alert_log TO authenticated;
GRANT ALL ON public.prayer_alert_log TO service_role;

ALTER TABLE public.prayer_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own prayer alert log"
ON public.prayer_alert_log FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prayer_alert_log_user_date
  ON public.prayer_alert_log (user_id, fired_for);
