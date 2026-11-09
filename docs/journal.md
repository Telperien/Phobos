# Journal

## 2026-11-09 — Étape 0 : socle

- Solution `Phobos.slnx` (.NET 10, SDK fixé à 10.0.401 dans `global.json`), quatre projets `src/` reliés vers le domaine. Domain, Application et Infrastructure sont vides : ils seront remplis à l'étape 2.
- Un seul projet de tests pour l'instant (`Phobos.Api.Tests`) : les autres seront créés avec leur premier test, pas avant.
- Outils locaux : `crapsharp` 0.1.0-preview.3 (pris dans le cache NuGet, comme `craft-test`) et `dotnet-stryker` 5.0.0.
- Tests : xUnit 2 + `coverlet.collector`, le chemin vérifié par CrapSharp (xunit.v3 demanderait `dotnet run`).
- CA1707 désactivé pour `tests/` : les noms de tests en phrases sont plus lisibles.
- `GET /api/health` en TDD : rouge (404) puis vert.
- Front : le modèle Vite proposait oxlint ; remplacé par Biome comme prévu (lint + format en un outil).
- `ApiStatus` en TDD : rouge (module absent) puis vert sur les deux cas (API en ligne, API en erreur).

## 2026-11-09 — Étape 1 : direction artistique (maquette)

- DA « Archives cliniques » : tokens dans `web/src/index.css` (encre, os, papier, rouille, vert maladif), grain de pellicule et vignettage en pseudo-éléments fixes, utilitaires `paper` et `label-mono`. Animations coupées si `prefers-reduced-motion`.
- Polices auto-hébergées via Fontsource (pas d'appel à Google Fonts, plus simple pour le RGPD) : Big Shoulders, Newsreader, IBM Plex Mono.
- TanStack Router (routes en code) et Motion ajoutés dès maintenant : la maquette a deux pages (`/` et `/dossiers/$slug`).
- En TDD : `HoldToReveal` (révéler en maintenant, souris ou clavier), `FearGauge` (rôle `meter`), `verdictFor` (verdict selon le niveau et la sortie). 17 tests verts.
- Données factices dans `web/src/mock/phobias.ts` (6 dossiers), à remplacer par l'API à l'étape 2.
- Bug trouvé au rendu : la règle `media/` du `.gitignore` racine excluait aussi `web/src/media/`, de git et de l'analyse Tailwind (classes manquantes). Restreinte à `/media/`.
- Exceptions Biome justifiées en commentaire : `role="meter"` (un `<meter>` natif ne dessine pas de segments nommés) et `!important` pour le mouvement réduit.
- Bundle JS : 482 kB (156 kB gzip). Découpage à revoir à l'étape 9.

## 2026-11-09 — Étape 2 : domaine, base et API de lecture

- Base locale : utilisateur PostgreSQL `phobos` / `phobos_dev` (développement uniquement, droit CREATEDB pour les bases de test jetables). Créé par l'utilisateur dans sa PowerShell, le mot de passe `postgres` n'a jamais transité par Claude.
- Domaine (TDD, rouge sur `NotImplementedException` avant chaque implémentation) : `Phobia` (slug, numéro de dossier 1-999, au moins une traduction, une seule par langue, repli sur l'anglais), `ExposureMedia` (images aux niveaux 1-2, vidéo YouTube au niveau 3, identifiant de 11 caractères), `Languages`, `RouletteDraw` (sans répétition jusqu'à épuisement du paquet).
- La règle de verdict reste côté front pour l'instant : le back n'en aura besoin qu'à l'étape 7 (statistiques).
- Slug unique par phobie (forme anglaise : `arachnophobia`). Les slugs traduits par langue sont reportés à l'étape 5 si le SEO le justifie.
- Application : `PhobiaQueries` (liste, dossier, tirage) ; filtrage « publié » et catégorie en mémoire (30 dossiers, inutile de le pousser en SQL).
- Infrastructure : EF Core 10 + Npgsql, une table `phobias`, textes et médias en colonnes `jsonb`, enums stockés par nom (test dédié). Migration `InitialCatalogue`. Images sur disque via `LocalDiskMediaStore`, clés strictement contrôlées (pas de `..`, pas de chemin absolu, extensions d'images seulement).
- Seed : `src/Phobos.Infrastructure/Seed/phobias.json`, 30 dossiers × 5 langues, chargé au démarrage si la base est vide (`Database:SeedOnStartup`).
- Caractères grecs rares (`ḗ`, `ṓ`) remplacés par `ē`, `ō` : la police ne les affiche pas.
- API : `GET /api/{lang}/phobias[?category=]`, `/api/{lang}/phobias/{slug}`, `/api/{lang}/phobias/random?seen=a,b`, `GET /media/{key}`. Langue inconnue → 404, catégorie inconnue → 400.
- `content/prompts.md` : prompts d'images IA niveaux 1 et 2 + pistes YouTube niveau 3.
- Mutation : Stryker avec analyse de couverture laissait survivre le code de démarrage (routes, configuration), exécuté une seule fois. Vérifié à la main (retirer `MapPhobiaEndpoints` fait échouer 7 tests), puis `coverage-analysis: off` dans les `stryker-config.json` de `Phobos.Api.Tests` et `Phobos.Infrastructure.Tests` : les mutants sont tués.
- Survivants restants acceptés : textes des messages d'erreur (domaine, seed, 400) — à couvrir à l'étape 6 quand le back-office les affichera ; mutants équivalents (`useAsync`, route `"/"` vs `""`, clé et accès par champ EF déjà déduits par convention).
- Simplifications guidées par les mutants : `RouletteDraw.Pick` rend l'élément tiré (plus de recherche par slug), découpage de `seen` réduit à `Split(',')`.
- Tests ajoutés après lecture des survivants : types d'images avif/jpeg/png, chargement initial idempotent et désactivable, dossier d'images configuré, tirage sans `seen`, format de stockage des enums.
- Résultats : 107 tests verts ; CRAP max 6 ; Stryker Domain 84,3 %, Application 100 %, Infrastructure 84,5 %, Api 93,5 % ; jscpd 0 clone (migrations générées exclues : le snapshot et le designer d'EF se répètent par construction).

## 2026-11-09 — Étape 3 : catalogue, parcours et carnet de bord

- Contrat back/front : réponses typées (`TypedResults`), document OpenAPI sur `/openapi/v1.json`, types TS générés par `npm run api:types` (openapi-typescript lancé via `npx` à version fixe, car il exige TypeScript 5 et le projet est en TypeScript 7). Client `openapi-fetch` + TanStack Query.
- Nombres JSON stricts : sinon .NET 10 décrit les entiers comme « nombre ou texte ». Test de contrat qui échoue sans le réglage.
- Logique pure en TDD : `journeyReducer` (niveaux 1→3, sortie, recommencer), carnet de bord (`localStorage`, version 1, tolérant au stockage absent ou corrompu), filtre du catalogue (catégorie, recherche sans accents, affrontées / à tenter) et lecture des filtres depuis l'URL.
- « Affrontée » = niveau 3 atteint, quelle que soit la sortie. L'ouverture d'un dossier (après l'avertissement) compte comme niveau 1.
- Composants en TDD : façade YouTube (rien n'est chargé avant le clic, lecteur `youtube-nocookie`, miniature retirée car elle appelait Google), avertissement d'entrée mémorisé.
- Pages : `/dossiers` (filtres dans l'URL, compteur, tampon « Affronté »), `/dossiers/$slug` (vraies données, images de remplacement tant qu'aucun média n'existe), `/mon-dossier` (liste, effacement confirmé), `/roulette` provisoire (un tirage, le vrai mode infini arrive à l'étape 4).
- Statistiques factices retirées des cartes et du verdict : elles reviendront avec de vraies données à l'étape 7.
- Trouvé au rendu mobile : les noms longs (« SUBMÉCANOPHOBIE ») débordaient (colonne de grille non rétrécissable) ; `grid-cols-1` + titre plus petit sur téléphone ; `overflow-x: clip` sur la page contre le débordement temporaire de l'animation d'entrée.
- Trouvé par Playwright : le nom accessible des cartes se réduisait à « N°001 ». Cartes nommées « Dossier N°001, Arachnophobie — affronté ».
- jscpd sur le front : grille de dossiers dupliquée entre l'accueil et le catalogue → `CaseFileGrid`.
- Résultats : 109 tests .NET verts, 49 tests Vitest, 6 tests Playwright (bureau + mobile), CRAP max 6, Stryker API 94,1 %, jscpd 0 clone (back et front), build OK (JS 508 kB, 164 kB gzip).
