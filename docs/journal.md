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
