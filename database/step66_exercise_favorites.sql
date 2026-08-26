-- =============================================================================
-- PlayPivot — Step 66: favoritos personales de ejercicios + ocultar el
-- original tras copiarlo a tu librería
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Dos arreglos relacionados que Dani pidió tras probar Library en producción:
--
-- 1. "favorite" vivía como una columna en la propia fila de "exercises".
--    Para un ejercicio compartido (visibility team/association/community),
--    esa fila es la MISMA para todo el mundo que la ve -- si Álvaro marca
--    su propio ejercicio como favorito, ese "favorite=true" viaja con la
--    fila y aparece como favorito también para Dani, aunque Dani nunca lo
--    haya marcado (y encima lo empujaba arriba del todo en su lista). Se
--    mueve a una tabla nueva "exercise_favorites" (usuario, ejercicio),
--    para que cada persona tenga sus propios favoritos sin afectar a
--    nadie más.
--
-- 2. "Copy to my library" crea una copia editable de un ejercicio
--    compartido en tu propio club, pero el original seguía apareciendo
--    también en la lista -- mismo ejercicio, dos filas (una en "My team",
--    otra en "PlayPivot Community"). Se agrega "copied_from_id" para
--    recordar de qué ejercicio viene una copia; library.html usa esa
--    columna para ocultar el original de la comunidad en cuanto ya
--    tienes tu propia copia.
--
-- La columna "exercises.favorite" NO se borra (para no perder datos ni
-- romper filas viejas) -- simplemente deja de leerse desde library.html/
-- exercises.html; queda como campo histórico sin uso.
-- =============================================================================

alter table public.exercises add column if not exists copied_from_id uuid references public.exercises(id) on delete set null;

comment on column public.exercises.copied_from_id is
  'Si este ejercicio se creó con "Copy to my library", apunta al ejercicio
   original compartido por el otro club. library.html lo usa para ocultar
   ese original de la lista en cuanto ya tienes tu propia copia editable.';

create table if not exists public.exercise_favorites (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  exercise_id   uuid not null references public.exercises(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create index if not exists exercise_favorites_user_idx on public.exercise_favorites (user_id);

alter table public.exercise_favorites enable row level security;

drop policy if exists "users see their own favorites" on public.exercise_favorites;
create policy "users see their own favorites"
  on public.exercise_favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users add their own favorites" on public.exercise_favorites;
create policy "users add their own favorites"
  on public.exercise_favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users remove their own favorites" on public.exercise_favorites;
create policy "users remove their own favorites"
  on public.exercise_favorites for delete
  to authenticated
  using (auth.uid() = user_id);

comment on table public.exercise_favorites is
  'Favoritos personales -- una fila por (usuario, ejercicio). Sustituye a
   exercises.favorite (que era una sola columna compartida por toda la fila,
   y por tanto visible/afectada por cualquiera que pudiera ver ese ejercicio,
   no solo por su dueño).';
