
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_azan_url text,
  ADD COLUMN IF NOT EXISTS azan_volume integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS prayer_alerts jsonb NOT NULL DEFAULT '{"fajr":true,"dhuhr":true,"asr":true,"maghrib":true,"isha":true}'::jsonb;

INSERT INTO storage.buckets (id, name, public)
VALUES ('azan-uploads', 'azan-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Azan uploads are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'azan-uploads');

CREATE POLICY "Users can upload their own azan files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'azan-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own azan files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'azan-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own azan files"
ON storage.objects FOR DELETE
USING (bucket_id = 'azan-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
