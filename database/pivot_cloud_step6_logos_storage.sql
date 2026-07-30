-- =============================================================================
-- Pivot Cloud — Club logos (Supabase Storage)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Creates a public storage bucket for logos. Each club's logo lives at a
-- predictable path: logos/<organization_id>/logo.png -- no extra database
-- column needed, the URL can always be rebuilt from the organization's id.
--
-- Only an active admin of a given club can upload/replace ITS OWN logo.
-- Anyone can view any logo (bucket is public) -- logos aren't sensitive,
-- and need to be visible in the app UI without extra permission checks.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- (limite fixée à 2 Mo pour les logos -- largement assez pour une image
--  propre, évite les fichiers énormes envoyés par erreur)

drop policy if exists "anyone can view logos" on storage.objects;
create policy "anyone can view logos"
  on storage.objects for select
  to public
  using (bucket_id = 'logos');

drop policy if exists "club admins upload their own logo" on storage.objects;
create policy "club admins upload their own logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and public.is_admin_of(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "club admins replace their own logo" on storage.objects;
create policy "club admins replace their own logo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and public.is_admin_of(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "club admins remove their own logo" on storage.objects;
create policy "club admins remove their own logo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and public.is_admin_of(((storage.foldername(name))[1])::uuid)
  );

-- =============================================================================
-- Done. Next: settings.html, where an admin can actually upload the file.
-- =============================================================================
