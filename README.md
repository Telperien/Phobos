# Phobos

Trouve ta peur : un catalogue de phobies à explorer par exposition graduée (3 niveaux : image mignonne, images poussées, vidéo).

## Prérequis

- .NET SDK 10 (version fixée par `global.json`)
- Node.js 24
- PostgreSQL 17 : `winget install PostgreSQL.PostgreSQL.17`

### Base de données locale

Une seule fois, créer l'utilisateur de développement (psql demande le mot de passe `postgres` choisi à l'installation) :

```powershell
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres -h localhost -c "CREATE ROLE phobos LOGIN PASSWORD 'phobos_dev' CREATEDB;"
```

`phobos` / `phobos_dev` ne sert qu'en local. Au démarrage en développement, l'API crée la base `phobos`, applique les migrations et charge les 30 dossiers de `src/Phobos.Infrastructure/Seed/phobias.json` si la base est vide. Les tests créent et suppriment leurs propres bases `phobos_test_*` (variable `PHOBOS_TEST_DB` pour viser un autre serveur).

## Démarrer en local

```bash
dotnet tool restore
dotnet run --project src/Phobos.Api        # API sur http://localhost:5080
```

```bash
cd web
npm install
npm run dev                                # site sur http://localhost:5173 (proxy /api vers l'API)
```

Les images vont dans `media/<slug>/<niveau>-<lettre>.webp` à la racine du dépôt (ignoré par git). Voir `content/prompts.md` pour les prompts de génération.

## API

| Requête | Réponse |
|---|---|
| `GET /api/{lang}/phobias?category=animals` | Liste des dossiers publiés (`fr`, `en`, `es`, `de`, `it`) |
| `GET /api/{lang}/phobias/{slug}` | Un dossier avec ses 3 niveaux |
| `GET /api/{lang}/phobias/random?seen=a,b` | Un dossier tiré au hasard parmi ceux pas encore vus |
| `GET /media/{key}` | Une image |

Catégories : `animals`, `nature-and-spaces`, `body-and-health`, `strange`.

## Structure

```
src/
  Phobos.Domain/          règles métier, sans dépendance
  Phobos.Application/     cas d'usage et ports (interfaces vers l'extérieur)
  Phobos.Infrastructure/  base de données (EF Core, PostgreSQL), stockage des médias, seed
  Phobos.Api/             endpoints HTTP
tests/                    tests .NET (xUnit), un projet par couche
web/                      site React (Vite, Tailwind, TanStack Router et Query)
content/                  prompts des images IA
docs/journal.md           journal des décisions
```

## Vérifications

Back (depuis la racine) :

```bash
dotnet test
dotnet crapsharp . --threshold 10 --exclude Migrations
npx --yes jscpd@5.4.2 src --format csharp --min-tokens 50 --min-lines 3 --threshold 0 --ignore "**/bin/**,**/obj/**,**/Migrations/**"
```

Mutation : depuis le dossier de tests de la couche touchée (`tests/Phobos.Domain.Tests`, etc.), qui contient son `stryker-config.json` (seuil 80 %) :

```bash
dotnet stryker
```

Front (depuis `web/`) :

```bash
npm run test
npm run lint
npm run build
```
