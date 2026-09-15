-- =============================================================================
-- PlayPivot -- step74_player_tracking
-- =============================================================================
-- A petición de Dani: nueva sección "Seguimiento" en Player assessment,
-- distinta del sistema de evaluación de 36 criterios fijos (nota 1-5) que ya
-- existía. Aquí el entrenador define SU PROPIO criterio libre -- "no una
-- nota, un valor que hay que decidir antes: tiempo, canastas, nota, peso,
-- distancia etc." -- y va añadiendo mediciones fechadas a ese mismo criterio
-- para ver si mejora o empeora con el tiempo.
--
-- Una fila = una medición: qué se mide (criterion, texto libre), en qué
-- unidad (unit, texto libre -- "seg", "kg", "canastas"...), cuándo (date),
-- el valor (result, numérico) y una nota opcional (evaluation). Todas las
-- mediciones del mismo criterion+unit para un jugador se agrupan en la app
-- para dibujar su evolución -- no hace falta una tabla de "criterios"
-- aparte, el propio texto del criterio hace de agrupador.
--
-- Tabla NUEVA, así que sí hace falta RLS explícita (a diferencia de las
-- migraciones anteriores, que solo añadían columnas a tablas que ya tenían
-- sus policies). Se usa el mismo patrón "cualquier miembro activo del club
-- puede leer/escribir los datos operativos de su club" que ya rige matches,
-- training_exercises, player_assessments, etc. -- no el patrón de
-- exercise_favorites (ronda 26/08), que es personal (auth.uid() = user_id)
-- porque un favorito no tiene sentido compartido; una medición de un
-- jugador sí es un dato de club, como una evaluación.
--
-- Seguro de correr más de una vez: "create table if not exists" y
-- "drop policy if exists" antes de crear cada policy.
-- =============================================================================

create table if not exists public.player_tracking_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  criterion text not null,
  unit text,
  date date not null,
  result numeric not null,
  evaluation text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists player_tracking_entries_player_idx
  on public.player_tracking_entries (player_id, date);

alter table public.player_tracking_entries enable row level security;

drop policy if exists "player_tracking_select_org_members" on public.player_tracking_entries;
create policy "player_tracking_select_org_members"
  on public.player_tracking_entries for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "player_tracking_insert_org_members" on public.player_tracking_entries;
create policy "player_tracking_insert_org_members"
  on public.player_tracking_entries for insert
  with check (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "player_tracking_update_org_members" on public.player_tracking_entries;
create policy "player_tracking_update_org_members"
  on public.player_tracking_entries for update
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "player_tracking_delete_org_members" on public.player_tracking_entries;
create policy "player_tracking_delete_org_members"
  on public.player_tracking_entries for delete
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid() and status = 'active'
    )
  );
