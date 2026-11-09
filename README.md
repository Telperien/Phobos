# Phobos

Trouve ta peur : un catalogue de phobies à explorer par exposition graduée (3 niveaux : image mignonne, images poussées, vidéo).

## Prérequis

- .NET SDK 10 (version fixée par `global.json`)
- Node.js 24
- PostgreSQL 17 (à partir de l'étape 2) : `winget install PostgreSQL.PostgreSQL.17`

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

## Structure

```
src/
  Phobos.Domain/          règles métier, sans dépendance
  Phobos.Application/     cas d'usage et ports (interfaces vers l'extérieur)
  Phobos.Infrastructure/  base de données, stockage des médias
  Phobos.Api/             endpoints HTTP
tests/                    tests .NET (xUnit)
web/                      site React (Vite, Tailwind, TanStack Query)
docs/journal.md           journal des décisions
```

## Vérifications

Back (depuis la racine) :

```bash
dotnet test
dotnet crapsharp . --threshold 10
npx --yes jscpd@5.4.2 src --format csharp --min-tokens 50 --min-lines 3 --threshold 0 --ignore "**/bin/**,**/obj/**"
```

Mutation (depuis un dossier de tests, sur le projet touché) :

```bash
dotnet stryker --project Phobos.Api.csproj --break-at 80
```

Front (depuis `web/`) :

```bash
npm run test
npm run lint
npm run build
```
