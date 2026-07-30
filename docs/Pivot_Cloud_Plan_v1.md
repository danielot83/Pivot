# Pivot Cloud — Plan d'architecture (v1)

*Document de travail — pas encore du code. Objectif : poser une base solide
avant d'écrire quoi que ce soit, comme convenu.*

## 1. Ce qu'on a établi ensemble

- **Ambition réelle** : pas seulement DEL — d'autres clubs/entraîneurs
  pourront s'en servir un jour.
- **Accès** : inscription libre, sans validation préalable — mais toi (le
  « contrôleur ») peux bloquer/exclure un compte si besoin.
- **Hors-ligne obligatoire** : ça doit marcher dans un pavillon sans wifi,
  et se resynchroniser tout seul quand la connexion revient.
- **Priorité** : un plan solide avant de coder, même si ça retarde le
  premier résultat visible.
- **App de bureau actuelle** : on gèle les nouvelles fonctionnalités une
  fois qu'on se lance sur ce projet — elle continue de fonctionner telle
  quelle pour DEL, mais l'énergie de développement va sur la nouvelle
  version.

## 2. Pourquoi ce choix technique précis

Le point qui a le plus pesé dans la décision : **hors-ligne + plusieurs
clubs en même temps**, ensemble, éliminent l'option « site web en Python »
qu'on regardait au début — une page web classique ne fonctionne tout
simplement pas sans connexion, quel que soit le langage.

Ce qui gère bien « hors-ligne + resynchronisation + plusieurs
organisations séparées les unes des autres » aujourd'hui :

| Brique | Choix retenu | Pourquoi |
|---|---|---|
| Interface (téléphone/tablette/ordinateur) | **PWA en JavaScript** (une page web « installable », sans passer par l'App Store/Play Store) | Gratuit à distribuer (pas de cotisation Apple/Google), un seul code pour tous les appareils via le navigateur. Le hors-ligne fonctionne bien sur Android ; sur iPhone ça marche aussi mais avec un peu moins de garanties (Apple limite la persistance du cache) — acceptable vu que seule la saisie des stats en direct pendant un match a vraiment besoin du hors-ligne. |
| Comptes, base de données, synchronisation | **Supabase** (open source, basé sur PostgreSQL) | Gère déjà, tout fait : comptes utilisateurs, inscription libre, blocage de comptes, séparation des données par club, et surtout la synchronisation hors-ligne. Réinventer tout ça nous-mêmes serait des mois de travail rien que pour la partie « sécurité et synchronisation » — un chantier qu'on ferait à coup sûr moins bien qu'un outil déjà utilisé par des milliers de projets. |
| Génération des PDF | **Petit service Python séparé**, réutilisant `pdf_builder*.py` presque tel quel | On ne jette pas tout le travail déjà fait sur les fiches vectorielles. La PWA envoie les données au service, qui renvoie le PDF fini. Coût : ~5-10 CHF/mois pour le petit serveur qui le fait tourner (type Infomaniak/Hetzner) — le seul serveur « classique » de tout le projet. |
| Aspect visuel | Style **minimaliste** façon ChemCalc/shadcn-ui | Cartes simples, beaucoup de blanc, icônes fines, peu de couleur — pas le style « gros boutons colorés » de l'app de bureau actuelle. |

Ce que ça implique honnêtement : ce n'est pas une évolution de l'app
actuelle, c'est un **nouveau projet construit à côté**, qui reprend les
concepts (secteurs de Suivi, structure saison/équipe, calculs...) mais
pas le code de l'interface.

**Coût réel, en un coup d'œil** : gratuit pour commencer (Supabase gratuit,
PWA sans cotisation Apple/Google) ; seul coût fixe dès le début, le petit
serveur pour les PDF (~5-10 CHF/mois) + le nom de domaine (15-20 CHF/an)
quand on sera prêts à le prendre.

## 3. Modèle de données (la vraie différence avec aujourd'hui)

Aujourd'hui, chaque installation de Pivot a ses propres dossiers sur son
propre ordinateur — il n'existe qu'un seul « club » implicite par
installation. Pour plusieurs clubs sur la même plateforme, il faut une
dimension en plus partout :

```
Organisation (le club)
 └─ Utilisateurs (avec un rôle : administrateur du club / entraîneur / assistant / joueur-parent en lecture seule)
 └─ Saisons
     └─ Équipes
         ├─ Effectif (joueurs)
         ├─ Exercices (propres au club, ou partagés depuis une bibliothèque commune)
         ├─ Cahiers
         ├─ Entraînements
         ├─ Matchs
         └─ Suivi individuel
```

Toi, en tant que « contrôleur », aurais un rôle au-dessus de tout ça —
mais limité à la gestion des comptes (activer/bloquer), **sans accès au
contenu** des clubs (voir décision tranchée en section 7). Techniquement,
ça veut dire que ton compte n'a pas de permission de lecture sur les
données des clubs dans la base — pas juste une interface qui ne montre
pas ces données.

La bibliothèque de 55 exercices actuels devient la base commune de
départ. Chaque club peut ensuite ajouter ses propres exercices privés, et
choisir librement, exercice par exercice, de les partager ou non avec les
autres clubs (voir section 7).

## 4. Correspondance avec ce qui existe déjà

Rien ne se perd conceptuellement — chaque module actuel a un équivalent
direct dans le nouveau système :

| Aujourd'hui (Pivot bureau) | Demain (Pivot Cloud) |
|---|---|
| `data/roster/<saison>/<équipe>/players.json` | Table `players`, filtrée par équipe/organisation |
| `data/exercises/*.json` | Table `exercises` (partagée ou par club) |
| `data/trainings/`, `data/matches/`, `data/suivi/` | Tables équivalentes, chacune liée à une équipe et une organisation |
| Génération de PDF (pdf_builder*.py) | Reprise presque telle quelle dans le petit service Python |
| `suivi.py` (critères, calculs, moyennes par secteur) | Logique reprise directement — c'est indépendant de l'interface |

## 5. Coûts réels estimés

| Poste | Coût |
|---|---|
| Supabase (démarrage, peu d'utilisateurs) | Gratuit |
| Supabase (une fois plusieurs clubs actifs) | ~25 $/mois |
| Nom de domaine (.ch ou .com) | 15–20 CHF/an |
| Service Python pour les PDF (hébergement léger) | ~5–10 CHF/mois |
| *Optionnel* — Compte développeur Apple (si on publie un jour une vraie app sur l'App Store) | ~99 $/an |
| *Optionnel* — Compte développeur Google (Play Store) | 25 $, une seule fois |

**Total réaliste** : quasiment gratuit les premiers mois (tant qu'on teste),
puis environ **150–250 CHF/an** une fois que plusieurs clubs l'utilisent
vraiment — sans compter les deux lignes optionnelles, qui n'arrivent que
si on décide un jour de sortir des vraies apps natives en plus de la PWA.

## 6. Découpage en phases (proposition)

Plutôt que tout construire d'un coup, une v1 utilisable rapidement puis
des vagues suivantes :

1. **Fondations** : comptes utilisateurs, structure organisation/saison/
   équipe, rôles (contrôleur / admin de club / entraîneur), stockage de
   base — sans encore de fonctionnalité basketball visible.
2. **Effectif + Bibliothèque d'exercices** : les deux modules les plus
   simples à migrer, pour valider que toute la mécanique (comptes,
   hors-ligne, synchronisation) fonctionne de bout en bout.
3. **Entraînement + Cahiers**.
4. **Match + statistiques**.
5. **Suivi individuel** (le plus gros module, à faire une fois le reste
   stable).
6. **Génération de PDF** en parallèle de chaque phase concernée.

## 7. Décisions tranchées

- **Bibliothèque d'exercices** : il existe une bibliothèque de base
  (les 55 exercices actuels), commune à tous les clubs au départ. Chaque
  club peut ensuite créer ses propres exercices en plus, et choisir
  librement de les garder privés ou de les partager avec les autres
  clubs. Pas de règle unique imposée — chaque club décide pour son propre
  contenu.
- **Rôle du contrôleur (toi)** : gestion des comptes uniquement
  (activer/bloquer un compte ou un club) — **tu ne vois pas le contenu**
  d'un club (joueurs, matchs, Suivi...) à moins qu'il ne soit
  explicitement partagé. C'est une vraie séparation des données, pas
  juste une convention — à garder en tête dès la conception de la base
  de données (permissions strictes, pas seulement une interface qui
  cache les choses).
- **Nom** : on garde **Pivot**.

## 8. Décisions encore ouvertes

- Faut-il un essai gratuit limité avant de demander un paiement, si un
  jour la monétisation arrive ?
