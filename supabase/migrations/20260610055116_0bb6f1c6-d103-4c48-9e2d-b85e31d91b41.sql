
-- Restrict profiles SELECT to the owner. All client reads of profiles are scoped to the
-- current user (settings); public mosque/follower displays don't need profile rows.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Restrict mosque_followers SELECT to authenticated users viewing their own follows.
-- Follower counts on mosques use the cached mosques.followers_count column.
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.mosque_followers;
CREATE POLICY "Users can view their own follows"
ON public.mosque_followers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Stop the azan-uploads bucket from being enumerable. Files remain reachable via
-- their public CDN URL (bucket is public) but listing/searching objects is blocked.
DROP POLICY IF EXISTS "Azan uploads are publicly readable" ON storage.objects;
