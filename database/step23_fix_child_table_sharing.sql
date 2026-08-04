-- =============================================================================
-- Pivot Cloud — Étape 23 : corrige un oubli des étapes 19-20
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- En ajoutant les 4 cercles à matches/trainings, j'ai oublié de mettre à
-- jour les tables LIÉES (match_player_stats, training_exercises,
-- training_attendance) : elles vérifiaient seulement "es-tu membre du
-- club propriétaire ?", sans jamais regarder le cercle de partage du
-- match/entrenamiento parent. Résultat concret : marquer un match
-- "🌐 Pivot Community" rendait la ligne "matches" visible à tout le
-- monde, mais les stats de chaque joueur restaient invisibles pour les
-- autres clubes -- la partie la plus utile du partage ne marchait pas.
-- =============================================================================

drop policy if exists "club members see their club's match stats" on public.match_player_stats;
create policy "voir les stats selon le cercle de partage du match"
  on public.match_player_stats for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (
          public.is_platform_controller()
          or (m.visibility = 'private' and m.created_by = auth.uid())
          or (m.visibility = 'team' and public.is_member_of(m.organization_id))
          or (m.visibility = 'association' and (public.is_member_of(m.organization_id) or public.shares_association_with(m.organization_id)))
          or (m.visibility = 'community')
        )
    )
  );

drop policy if exists "voir/ajouter/modifier les exercices d'un entrenamiento" on public.training_exercises;
create policy "voir les exercices selon le cercle de partage de l'entrenamiento"
  on public.training_exercises for select to authenticated
  using (
    exists (
      select 1 from public.trainings t
      where t.id = training_id
        and (
          public.is_platform_controller()
          or (t.visibility = 'private' and t.created_by = auth.uid())
          or (t.visibility = 'team' and public.is_member_of(t.organization_id))
          or (t.visibility = 'association' and (public.is_member_of(t.organization_id) or public.shares_association_with(t.organization_id)))
          or (t.visibility = 'community')
        )
    )
  );

drop policy if exists "voir/ajouter/modifier l'attendance" on public.training_attendance;
create policy "voir l'attendance selon le cercle de partage de l'entrenamiento"
  on public.training_attendance for select to authenticated
  using (
    exists (
      select 1 from public.trainings t
      where t.id = training_id
        and (
          public.is_platform_controller()
          or (t.visibility = 'private' and t.created_by = auth.uid())
          or (t.visibility = 'team' and public.is_member_of(t.organization_id))
          or (t.visibility = 'association' and (public.is_member_of(t.organization_id) or public.shares_association_with(t.organization_id)))
          or (t.visibility = 'community')
        )
    )
  );

-- Note : les noms/photos réels des joueurs restent, eux, toujours
-- limités à leur propre club (roster non partagé, décision de Daniel) --
-- un autre club qui voit un match/entrenamiento partagé verra donc les
-- chiffres (minutes, points, présence...) mais pas forcément le nom du
-- joueur associé, puisque la table players garde sa propre règle,
-- inchangée. C'est voulu : les données personnelles restent protégées
-- même quand le contenu autour (le match, la séance) est partagé.
-- =============================================================================
