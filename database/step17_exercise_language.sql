-- =============================================================================
-- Pivot Cloud — Exercise library: language variants (EN/FR/ES trial)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Cómo funciona: un mismo ejercicio puede existir en varios idiomas, cada
-- uno como su PROPIA fila (nunca mezclado dentro del mismo JSON). Lo que
-- une esas filas como "el mismo ejercicio, en otro idioma" es
-- translation_group_id: todas las traducciones de un ejercicio comparten
-- ese mismo identificador, aunque cada una tenga su propio id, su propio
-- nombre traducido, sus propios objetivos traducidos, etc.
--
-- Ejemplo: "Passing lanes" (en) y "Couloirs de passe" (fr) son dos filas
-- distintas en la tabla, con distinto id, pero el mismo
-- translation_group_id -- así se sabe que son la misma jugada/ejercicio,
-- solo que en dos idiomas.
--
-- Las filas que ya existían hoy (todas en inglés) se marcan
-- automáticamente como language='en', y cada una recibe su propio
-- translation_group_id nuevo -- es decir, hoy cada ejercicio existente
-- forma un grupo de traducción de un solo idioma, listo para que se le
-- añadan más traducciones más adelante sin tocar nada de lo ya guardado.
-- =============================================================================

alter table public.exercises
  add column if not exists language text not null default 'en',
  add column if not exists translation_group_id uuid;

alter table public.exercises
  add constraint exercises_language_check
  check (language in ('en', 'fr', 'es'));

-- Cada fila existente que no tenga aún un grupo, recibe uno propio.
update public.exercises
set translation_group_id = uuid_generate_v4()
where translation_group_id is null;

alter table public.exercises
  alter column translation_group_id set not null,
  alter column translation_group_id set default uuid_generate_v4();

comment on column public.exercises.language is
  'Idioma de ESTA fila en concreto: en, fr o es. Cada traducción es su propia fila.';
comment on column public.exercises.translation_group_id is
  'Enlaza todas las traducciones de un mismo ejercicio entre sí. Mismo grupo = mismo ejercicio, distinto idioma.';

-- Para poder filtrar rápido "solo ejercicios en francés", o "todas las
-- traducciones de este ejercicio", sin que la biblioteca se ralentice
-- según crezca el número de ejercicios.
create index if not exists exercises_language_idx on public.exercises (language);
create index if not exists exercises_translation_group_idx on public.exercises (translation_group_id);
