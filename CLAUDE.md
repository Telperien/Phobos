# Phobos — consignes de développement

Site React + .NET 10 pour découvrir ses phobies (5 niveaux d'exposition, modes Catalogue et Roulette, 5 langues : fr, en, es, de, it). Pas de base de données : un fichier JSON par phobie dans `content/phobias/`, embarqué dans l'API.

## Discipline (skill dotnet-craft)

- TDD strict : un test qui échoue pour la bonne raison, puis le code minimal, puis le refactoring.
- Les dépendances pointent vers `Phobos.Domain` ; les effets (contenu, fichiers, horloge, hasard) passent par des interfaces de `Phobos.Application`.
- Après chaque changement back, dans cet ordre :
  1. `dotnet test`
  2. `dotnet crapsharp . --threshold 10` : chaque méthode strictement sous 10
  3. `dotnet stryker` depuis le dossier de tests concerné (config `stryker-config.json`, seuil 80 %). Lire chaque survivant : test de comportement, code à supprimer, ou mutant équivalent noté au journal.
  4. `npx --yes jscpd@5.4.2 src --format csharp --min-tokens 50 --min-lines 3 --threshold 0 --ignore "**/bin/**,**/obj/**"`
- Front (et `web/scripts/`) : logique testée avec Vitest avant d'être écrite ; `npm run lint` (Biome), `npm run build` et `npm run e2e` (Playwright) doivent passer. Lancer aussi jscpd sur `web/src` (format `typescript,tsx`, en ignorant `schema.d.ts`).
- Contrat API : après un changement d'endpoint, `npm run api:types` (API lancée) régénère les types TS ; ne jamais les écrire à la main.
- Noter les décisions dans `docs/journal.md` (daté, court).
- Petits commits : pourquoi, quoi, preuve (commande + résultat).

## Conventions

- Noms de tests en phrases avec `_` (CA1707 désactivé pour `tests/`).
- Warnings traités comme des erreurs (`Directory.Build.props`).
- Contenu : `content/phobias/<slug>.json` (nom du fichier = slug). Images sources dans `media-src/`, préparées par `npm run media` dans `media/` (hors git, Azure Files en production). Une image du web exige `license` et `url`.
- API sur le port 5080, site Vite sur 5173 (proxy `/api`).
- Interface en 5 langues sous `/fr`, `/en`, `/es`, `/de`, `/it` ; pas de rose, ambiance « archives cliniques ».
- Textes de l'interface : jamais en dur dans les composants. `web/src/i18n/messages/fr.ts` est la référence ; une clé ajoutée l'est dans les 5 langues (TypeScript et `messages.test.ts` le vérifient). Tutoiement, formulations neutres en genre.
