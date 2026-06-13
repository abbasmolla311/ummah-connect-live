
-- Bookmarks: restrict SELECT to authenticated role
DROP POLICY IF EXISTS "Users view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users view their own bookmarks" ON public.bookmarks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Event RSVPs: drop public-read, owner-only SELECT
DROP POLICY IF EXISTS "RSVPs viewable by everyone" ON public.event_rsvps;
CREATE POLICY "Users view their own RSVP" ON public.event_rsvps
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Safe aggregate counts function (no user_id leakage)
CREATE OR REPLACE FUNCTION public.get_event_attendee_counts(event_ids uuid[])
RETURNS TABLE(event_id uuid, count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_id, COUNT(*)::bigint
  FROM public.event_rsvps
  WHERE event_id = ANY(event_ids)
  GROUP BY event_id
$$;

GRANT EXECUTE ON FUNCTION public.get_event_attendee_counts(uuid[]) TO anon, authenticated;
