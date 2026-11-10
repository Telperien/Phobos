# Phobos

Trouve ta peur : un catalogue de phobies à explorer par exposition graduée (5 niveaux : quatre images progressivement plus intenses, puis une vidéo).

## Prérequis

- .NET SDK 10 (version fixée par `global.json`)
- Node.js 24

Aucune base de données : le catalogue vit dans des fichiers du dépôt.

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

## Contenu

Chaque phobie est un fichier `content/phobias/<slug>.json` : numéro, catégorie, textes dans les 5 langues, images (niveaux 1 à 4) et vidéo YouTube (niveau 5). Le fichier est embarqué dans l'API ; une erreur (niveau impossible, identifiant YouTube mal formé, image du web sans licence…) fait échouer les tests et empêche l'API de démarrer, avec le nom du fichier fautif. `"published": false` garde un dossier en brouillon.

```json
"images": [
  { "level": 1, "file": "arachnophobia/1-a.webp", "origin": "ai" },
  { "level": 2, "file": "arachnophobia/2-a.webp", "origin": "web",
    "author": "Jean Dupont", "license": "CC BY 4.0", "url": "https://commons.wikimedia.org/wiki/File:…" }
],
"video": { "youtube": "dQw4w9WgXcQ", "start": 30 }
```

Une image du web n'est publiable que si sa licence le permet (domaine public, CC0, CC BY, CC BY-SA, Unsplash, Pexels…) ; auteur, licence et lien s'affichent sous l'image. Une image IA n'a besoin que de `"origin": "ai"`.

### Images

1. Déposer les sources dans `media-src/<slug>/<niveau>-<lettre>.<png|jpg|jpeg|webp|avif>` (ignoré par git), par exemple `media-src/arachnophobia/3-b.png`.
2. Depuis `web/` : `npm run media`. Le script liste les images non déclarées (avec l'entrée JSON à ajouter), convertit les images déclarées en `media/<slug>/<niveau>-<lettre>.webp` (1600 px au plus, métadonnées retirées) et s'arrête si une image déclarée manque ou si une image du web n'a pas sa licence. `npm run media -- --declare-ai` déclare d'office les images non déclarées comme images IA.
3. En production : `./infra/upload-media.ps1` (prépare puis envoie `media/` sur Azure Files).

Prompts de génération : `content/prompts.md`. Les générations brutes et variantes non retenues se rangent dans `media-generated/` (hors git) : ni le script ni le site ne les lisent.

## Langues

Le site existe en français, anglais, espagnol, allemand et italien, sous `/fr`, `/en`, `/es`, `/de`, `/it`. `/` envoie vers la langue choisie la dernière fois, sinon celle du navigateur, sinon l'anglais. Une adresse sans langue (`/dossiers`) reçoit celle du visiteur.

Les textes de l'interface sont dans `web/src/i18n/messages/` (`fr.ts` sert de référence). Ceux des dossiers viennent de l'API, avec repli sur l'anglais si une traduction manque.

## API

| Requête | Réponse |
|---|---|
| `GET /api/{lang}/phobias?category=animals` | Liste des dossiers publiés (`fr`, `en`, `es`, `de`, `it`) |
| `GET /api/{lang}/phobias/{slug}` | Un dossier avec ses 5 niveaux |
| `GET /api/{lang}/phobias/random?seen=a,b&exclude=c` | Un dossier tiré au hasard parmi ceux pas encore vus dans le tour (`seen`, du plus ancien au plus récent), jamais parmi `exclude` ; 204 s'il ne reste rien |
| `GET /media/{key}` | Une image |

Catégories : `animals`, `nature-and-spaces`, `body-and-health`, `strange`.

## Structure

```
src/
  Phobos.Domain/          règles métier, sans dépendance
  Phobos.Application/     cas d'usage et ports (interfaces vers l'extérieur)
  Phobos.Infrastructure/  lecture du contenu (content/phobias, embarqué), stockage des images
  Phobos.Api/             endpoints HTTP
tests/                    tests .NET (xUnit), un projet par couche
web/                      site React (Vite, Tailwind, TanStack Router et Query)
content/phobias/          un fichier JSON par phobie
content/prompts.md        prompts des images IA
media-src/, media/        images sources et préparées (hors git)
web/scripts/media.ts      préparation des images
docs/journal.md           journal des décisions
```

## Déployer sur Azure

Une seule App Service Linux (.NET 10, plan B1) sert l'API, le catalogue embarqué et le site buildé (`web/dist` copié dans `wwwroot`) ; un partage Azure Files monté sur `/mounts/media` porte les images. Région `francecentral`. Coût indicatif : ~15 €/mois (l'App Service ; le stockage des images coûte quelques centimes).

Une fois, depuis la racine (PowerShell, `az login` et `gh auth login` faits) :

```powershell
./infra/bootstrap.ps1
```

Le script crée le groupe `rg-phobos` et les ressources (`infra/main.bicep`), une identité GitHub Actions sans secret (OIDC, droit `Website Contributor` sur le seul site), les variables du dépôt et l'environnement `production`, puis prépare et envoie les images (`infra/upload-media.ps1`). Relancer `-SkipMedia` pour ne mettre à jour que l'infra ; pour de nouvelles images seulement, `./infra/upload-media.ps1`.

Ensuite, chaque push sur `main` passe par `.github/workflows/ci-cd.yml` : tests .NET, tests, lint et build du front, publication, déploiement, puis vérification de `/api/health`. Les PR ne font que la partie build et tests. Ajouter ou modifier une phobie passe donc par un commit sur `main`.

## Vérifications

Back (depuis la racine) :

```bash
dotnet test
dotnet crapsharp . --threshold 10
npx --yes jscpd@5.4.2 src --format csharp --min-tokens 50 --min-lines 3 --threshold 0 --ignore "**/bin/**,**/obj/**"
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
