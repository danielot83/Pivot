-- =============================================================================
-- Pivot Cloud — Roster: player photo + license photo (Supabase Storage)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Unlike the club logo (public), these buckets are kept PRIVATE: rosters
-- often include minors, so photos should only be viewable by people
-- actually in that club, not by anyone who guesses a URL. The app fetches
-- them with a short-lived signed URL instead of a plain public link.
--
-- Path convention (same idea as logos): <player_id>/photo.png and
-- <player_id>/license.png -- no extra database column needed.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('player-photos', 'player-photos', false, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('license-photos', 'license-photos', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- -----------------------------------------------------------------------------
-- Vue : peut voir la photo si on est membre actif du club auquel appartient
-- CE joueur précis (le dossier du chemin donne l'id du joueur, on retrouve
-- son club, puis on vérifie l'appartenance -- comme pour les logos, mais
-- avec un niveau d'indirection en plus).
-- -----------------------------------------------------------------------------
create or replace function public.can_view_player_photo(player_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.players p
    where p.id = player_id
      and (public.is_member_of(p.organization_id) or public.is_platform_controller())
  );
$$ language sql security definer stable;

create or replace function public.can_edit_player_photo(player_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.players p
    where p.id = player_id
      and public.can_edit_content(p.organization_id)
  );
$$ language sql security definer stable;

drop policy if exists "club members view player photos" on storage.objects;
create policy "club members view player photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('player-photos', 'license-photos')
    and public.can_view_player_photo(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "coaches upload player photos" on storage.objects;
create policy "coaches upload player photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('player-photos', 'license-photos')
    and public.can_edit_player_photo(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "coaches replace player photos" on storage.objects;
create policy "coaches replace player photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('player-photos', 'license-photos')
    and public.can_edit_player_photo(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "coaches remove player photos" on storage.objects;
create policy "coaches remove player photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('player-photos', 'license-photos')
    and public.can_edit_player_photo(((storage.foldername(name))[1])::uuid)
  );

-- =============================================================================
-- Done. Next: roster.html gets upload buttons for both photo types.
-- =============================================================================
