# Phobos — consignes de développement

Site React + .NET 10 pour découvrir ses phobies (3 niveaux d'exposition, modes Catalogue et Roulette, 5 langues : fr, en, es, de, it).

## Discipline (skill dotnet-craft)

- TDD strict : un test qui échoue pour la bonne raison, puis le code minimal, puis le refactoring.
- Les dépendances pointent vers `Phobos.Domain` ; les effets (base, fichiers, horloge, hasard) passent par des interfaces de `Phobos.Application`.
- Après chaque changement back, dans cet ordre :
  1. `dotnet test`
  2. `dotnet crapsharp . --threshold 10 --exclude Migrations` : chaque méthode strictement sous 10
  3. `dotnet stryker` depuis le dossier de tests concerné (config `stryker-config.json`, seuil 80 %). Lire chaque survivant : test de comportement, code à supprimer, ou mutant équivalent noté au journal.
  4. `npx --yes jscpd@5.4.2 src --format csharp --min-tokens 50 --min-lines 3 --threshold 0 --ignore "**/bin/**,**/obj/**,**/Migrations/**"`
- Front : logique testée avec Vitest avant d'être écrite ; `npm run lint` (Biome) et `npm run build` doivent passer.
- Noter les décisions dans `docs/journal.md` (daté, court).
- Petits commits : pourquoi, quoi, preuve (commande + résultat).

## Conventions

- Noms de tests en phrases avec `_` (CA1707 désactivé pour `tests/`).
- Warnings traités comme des erreurs (`Directory.Build.props`).
- Base locale : PostgreSQL, utilisateur `phobos` / `phobos_dev` ; les tests créent et suppriment leurs bases `phobos_test_*`.
- Code généré par EF (`Migrations/`) exclu de CRAP, Stryker et jscpd.
- API sur le port 5080, site Vite sur 5173 (proxy `/api`).
- Interface en français par défaut ; pas de rose, ambiance « archives cliniques ».
