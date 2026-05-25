
-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements viewable by everyone" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Mosque owners or admins can insert announcements" ON public.announcements FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = mosque_id AND m.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Mosque owners or admins can update announcements" ON public.announcements FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = mosque_id AND m.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Mosque owners or admins can delete announcements" ON public.announcements FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = mosque_id AND m.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER trg_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_announcements_mosque ON public.announcements(mosque_id, created_at DESC);

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Mosque owners or admins can insert events" ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = mosque_id AND m.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Mosque owners or admins can update events" ON public.events FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = mosque_id AND m.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Mosque owners or admins can delete events" ON public.events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = mosque_id AND m.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_events_mosque_starts ON public.events(mosque_id, starts_at DESC);

-- EVENT RSVPs
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RSVPs viewable by everyone" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users insert their own RSVP" ON public.event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own RSVP" ON public.event_rsvps FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own RSVP" ON public.event_rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- BOOKMARKS (Quran / Hadith / Dua)
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('ayah','hadith','dua')),
  ref_key TEXT NOT NULL,
  label TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_key)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own bookmarks" ON public.bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- TASBIH SESSIONS
CREATE TABLE public.tasbih_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  zikr TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 33,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasbih_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own tasbih" ON public.tasbih_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own tasbih" ON public.tasbih_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own tasbih" ON public.tasbih_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own tasbih" ON public.tasbih_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_tasbih_updated_at
BEFORE UPDATE ON public.tasbih_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
