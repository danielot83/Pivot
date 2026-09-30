-- =============================================================================
-- Pivot Cloud — Étape 87 : ce que je vois dans Training/Match/Exercises/
-- Plays ne doit JAMAIS dépendre de is_platform_controller()
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Dani, 2026-09-30, captura de Training builder ("Shared by other clubs"
-- listait les entraînements de SON PROPRE autre club DEL, alors qu'il ne
-- les a jamais partagés) : la politique RLS "select" sur trainings/
-- matches/exercises/plays (step19/step20) laisse TOUJOURS passer
-- is_platform_controller() en premier -- voulu pour Admin general
-- (dashboard.html, stats plateforme), mais ça veut dire qu'un compte
-- contrôleur qui utilise ces écrans NORMALEMENT (pas Admin general) reçoit
-- en fait TOUTES les lignes de TOUTE la plateforme, pas seulement celles
-- que les 4 cercles de partage (private/team/association/community)
-- laisseraient voir à un simple membre. training.html (et les 4 autres
-- fichiers touchés dans ce même lot) traitait ensuite naïvement "toute
-- ligne d'un autre club que je reçois" comme "partagée avec moi".
--
-- Solution : une fonction par table qui rejoue EXACTEMENT les 4 cercles de
-- la politique RLS, sans jamais le OR "is_platform_controller()" -- que le
-- compte appelant soit contrôleur ou non change maintenant strictement
-- rien à ce que ces 4 fonctions renvoient. Admin general (dashboard.html)
-- continue d'interroger les tables directement (RLS inchangée, bypass
-- toujours actif là où c'est voulu) -- ces 4 fonctions ne remplacent RIEN
-- côté Admin general, seulement les écrans de travail normaux.
-- =============================================================================

create or replace function public.visible_trainings()
returns setof public.trainings
language sql security definer stable
set search_path = public, pg_temp
as $$
  select * from public.trainings t
  where (t.visibility = 'private' and t.created_by = auth.uid())
     or (t.visibility = 'team' and public.is_member_of(t.organization_id))
     or (t.visibility = 'association' and (public.is_member_of(t.organization_id) or public.shares_association_with(t.organization_id)))
     or (t.visibility = 'community');
$$;

create or replace function public.visible_matches()
returns setof public.matches
language sql security definer stable
set search_path = public, pg_temp
as $$
  select * from public.matches m
  where (m.visibility = 'private' and m.created_by = auth.uid())
     or (m.visibility = 'team' and public.is_member_of(m.organization_id))
     or (m.visibility = 'association' and (public.is_member_of(m.organization_id) or public.shares_association_with(m.organization_id)))
     or (m.visibility = 'community');
$$;

create or replace function public.visible_exercises()
returns setof public.exercises
language sql security definer stable
set search_path = public, pg_temp
as $$
  select * from public.exercises e
  where (e.visibility = 'private' and e.created_by = auth.uid())
     or (e.visibility = 'team' and public.is_member_of(e.organization_id))
     or (e.visibility = 'association' and (public.is_member_of(e.organization_id) or public.shares_association_with(e.organization_id)))
     or (e.visibility = 'community');
$$;

create or replace function public.visible_plays()
returns setof public.plays
language sql security definer stable
set search_path = public, pg_temp
as $$
  select * from public.plays p
  where (p.visibility = 'private' and p.created_by = auth.uid())
     or (p.visibility = 'team' and public.is_member_of(p.organization_id))
     or (p.visibility = 'association' and (public.is_member_of(p.organization_id) or public.shares_association_with(p.organization_id)))
     or (p.visibility = 'community');
$$;

-- Même chose pour notebooks (les "Cahiers" -- step34), trouvé en corrigeant
-- library.html dans ce même lot : exactement le même pattern 4 cercles +
-- bypass contrôleur (step34_notebooks_and_training_fields.sql).
create or replace function public.visible_notebooks()
returns setof public.notebooks
language sql security definer stable
set search_path = public, pg_temp
as $$
  select * from public.notebooks n
  where (n.visibility = 'private' and n.created_by = auth.uid())
     or (n.visibility = 'team' and public.is_member_of(n.organization_id))
     or (n.visibility = 'association' and (public.is_member_of(n.organization_id) or public.shares_association_with(n.organization_id)))
     or (n.visibility = 'community');
$$;

comment on function public.visible_trainings() is
  'Mêmes 4 cercles que la politique RLS de select sur trainings, MOINS le bypass is_platform_controller() -- pour que les écrans de travail normaux (training.html) voient toujours exactement ce que verrait un simple membre, même depuis un compte contrôleur.';
comment on function public.visible_matches() is
  'Idem visible_trainings(), pour matches (match.html).';
comment on function public.visible_exercises() is
  'Idem visible_trainings(), pour exercises (exercises.html, library.html).';
comment on function public.visible_plays() is
  'Idem visible_trainings(), pour plays (play_library.html).';
comment on function public.visible_notebooks() is
  'Idem visible_trainings(), pour notebooks / les "Cahiers" (library.html).';

grant execute on function public.visible_trainings() to authenticated;
grant execute on function public.visible_matches() to authenticated;
grant execute on function public.visible_exercises() to authenticated;
grant execute on function public.visible_plays() to authenticated;
grant execute on function public.visible_notebooks() to authenticated;
