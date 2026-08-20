-- =============================================================================
-- PlayPivot — Step 63: logo por equipo (no solo por club)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- No hace falta una tabla ni una columna nueva -- el logo de un equipo
-- vive en el mismo bucket "logos" que ya existe, en una ruta
-- predecible: logos/<organization_id>/teams/<nombre del equipo>.png
-- (igual que el logo del club vive en logos/<organization_id>/logo.png).
-- El nombre de archivo se arma a partir del nombre del equipo, así que
-- no hay nada que sincronizar aparte si el equipo se renombra -- eso sí,
-- el logo viejo queda huérfano en el storage cuando se renombra un
-- equipo (no rompe nada, solo ocupa espacio -- se puede limpiar a mano
-- después si hace falta).
--
-- Las políticas que ya existían (step "logos_storage") solo dejaban
-- subir/reemplazar el logo a un ADMIN del club. Como crear un equipo
-- ya lo puede hacer cualquier coach (no hace falta ser admin), el logo
-- del equipo debería poder subirlo esa misma persona -- si no, se
-- queda a mitad de camino la primera vez que un coach (no admin) prueba
-- esto. Este paso amplía subir/reemplazar para cualquiera con permiso
-- de editar contenido de ese club (misma función que ya protege crear
-- jugadores, partidos, etc.). Borrar sigue siendo solo para admins.
-- =============================================================================

drop policy if exists "club admins upload their own logo" on storage.objects;
create policy "club admins upload their own logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (
      public.is_admin_of(((storage.foldername(name))[1])::uuid)
      or public.can_edit_content(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "club admins replace their own logo" on storage.objects;
create policy "club admins replace their own logo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (
      public.is_admin_of(((storage.foldername(name))[1])::uuid)
      or public.can_edit_content(((storage.foldername(name))[1])::uuid)
    )
  );
