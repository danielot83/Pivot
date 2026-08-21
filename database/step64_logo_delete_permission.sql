-- =============================================================================
-- PlayPivot — Step 64: falta el borrado de logo (paso 63 se olvidó de este)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- En el paso 63 amplié quién puede SUBIR/REEMPLAZAR un logo (cualquier
-- coach con permiso de editar contenido, no solo un admin) -- pero me
-- olvidé de hacer lo mismo con BORRAR. Por eso el checkbox "Remove this
-- team's logo" no funcionaba: la fila se borraba... o mejor dicho, NO
-- se borraba, porque la política de RLS lo bloqueaba en silencio (sin
-- error visible, así que el logo viejo se quedaba ahí como si nada).
-- =============================================================================

drop policy if exists "club admins remove their own logo" on storage.objects;
create policy "club admins remove their own logo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and (
      public.is_admin_of(((storage.foldername(name))[1])::uuid)
      or public.can_edit_content(((storage.foldername(name))[1])::uuid)
    )
  );
