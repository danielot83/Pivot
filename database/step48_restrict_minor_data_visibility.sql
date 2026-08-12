-- =============================================================================
-- Pivot Cloud — Étape 48 : jamais "Pivot Community" pour des données de
-- mineurs identifiables
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Le roster (players) avait déjà cette protection depuis le début (une
-- vraie contrainte en base, pas juste une case décochée dans
-- l'interface) -- mais évaluations, matchs et entraînements ne
-- l'avaient jamais eue, alors qu'ils contiennent tous des données
-- identifiables de vrais joueurs (souvent mineurs) : l'évaluation
-- détaillée d'un enfant, les stats nommées d'un match, la liste de
-- présence d'une séance. "Community" veut dire visible par TOUS les
-- clubs de la plateforme -- ça n'a jamais de raison d'être pour ce
-- genre de contenu.
--
-- Les jugadas et exercices restent partageables en Community, exprès :
-- c'est du contenu générique/tactique, jamais un enfant identifié.
-- =============================================================================

-- On redescend d'abord toute ligne déjà en "community" vers "association"
-- (encore restreint, jamais totalement public) -- pour que la contrainte
-- qui suit ne casse rien sur des données déjà là.
update public.player_assessments set visibility = 'association' where visibility = 'community';
update public.matches set visibility = 'association' where visibility = 'community';
update public.trainings set visibility = 'association' where visibility = 'community';

alter table public.player_assessments drop constraint if exists player_assessments_visibility_check;
alter table public.player_assessments add constraint player_assessments_visibility_check
  check (visibility in ('private', 'team', 'association'));
alter table public.matches drop constraint if exists matches_visibility_check;
alter table public.matches add constraint matches_visibility_check
  check (visibility in ('private', 'team', 'association'));
alter table public.trainings drop constraint if exists trainings_visibility_check;
alter table public.trainings add constraint trainings_visibility_check
  check (visibility in ('private', 'team', 'association'));

comment on column public.player_assessments.visibility is
  'Jamais "community" (contrainte en base) -- une évaluation contient toujours l''évaluation d''un vrai joueur, souvent mineur.';
comment on column public.matches.visibility is
  'Jamais "community" (contrainte en base) -- les stats par joueur (match_player_stats) suivent cette visibilité, avec de vrais noms.';
comment on column public.trainings.visibility is
  'Jamais "community" (contrainte en base) -- la liste de présence contient de vrais noms de joueurs.';
