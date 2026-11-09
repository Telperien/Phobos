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
| `GET /api/{lang}/phobias/random?seen=a,b&exclude=c` | Un dossier tiré au hasard parmi ceux pas encore vus dans le tour (`seen`, du plus ancien au plus récent), jamais parmi `exclude` ; 204 s'il ne reste rien |
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

## Déployer sur Azure

Une seule App Service Linux (.NET 10, plan B1) sert l'API et le site buildé (`web/dist` copié dans `wwwroot`), PostgreSQL Flexible Server (B1ms) porte le catalogue, un partage Azure Files monté sur `/mounts/media` porte les images. Région `francecentral`. Coût indicatif : ~30 €/mois (≈ moitié App Service, moitié PostgreSQL).

Une fois, depuis la racine (PowerShell, `az login` et `gh auth login` faits) :

```powershell
./infra/bootstrap.ps1
```

Le script crée le groupe `rg-phobos` et les ressources (`infra/main.bicep`), une identité GitHub Actions sans secret (OIDC, droit `Website Contributor` sur le seul site), les variables du dépôt et l'environnement `production`, puis envoie `media/`. Relancer `-SkipMedia` pour ne mettre à jour que l'infra ; relancer sans pour renvoyer les images.

Ensuite, chaque push sur `main` passe par `.github/workflows/ci-cd.yml` : tests .NET (contre un PostgreSQL de service), tests, lint et build du front, publication, déploiement, puis vérification de `/api/health`. Les PR ne font que la partie build et tests. Au démarrage, l'API applique les migrations et charge le seed si la base est vide.

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
npm run e2e        # Playwright, bureau + mobile ; démarre l'API et Vite si besoin
```

Après un changement de l'API (API lancée) : `npm run api:types` régénère et formate `web/src/api/schema.d.ts`.
