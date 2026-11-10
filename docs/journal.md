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

## 2026-11-09 — Étape 4 : roulette infinie

- Domaine : un nouveau tour ne commence jamais par le dossier qu'on vient de voir (`seen` devient une liste ordonnée ; le dernier élément est le dossier affiché). Un paquet d'un seul dossier le ressert.
- Application et API : `exclude` (dossiers à ne jamais tirer, ici les phobies affrontées), distinct de `seen` (dossiers déjà vus dans le tour). Plus rien à tirer → 204 au lieu de 404, pour ne pas confondre avec une langue inconnue.
- Critère de l'étape testé deux fois : 30 tirages distincts puis un nouveau tour qui ne répète pas le dernier (`PhobiaQueriesTests`, `round.test.ts`).
- Front : le tour vit dans `sessionStorage` (`phobos.roulette`, version 1, tolérant) ; le client détecte un nouveau tour quand l'API sert un dossier déjà vu. Option « pas encore affrontées » dans l'URL (`?skipFaced=true`).
- Profil de peurs calculé depuis le carnet (TDD) : décompte des verdicts, peur dominante (arrêt au niveau 1 = 3 points, niveau 2 = 2, niveau 3 = 1, « pas phobique » = 0 ; égalité → ordre des catégories), pire réaction (niveau le plus bas, puis la plus récente). Affiché sur la roulette et sur « Mon dossier ».
- Parcours d'un dossier extrait dans `CaseFileJourney`, partagé par la fiche et la roulette (le bouton principal du verdict est passé en paramètre).
- Trouvé dans le navigateur : « Tirer parmi tous les dossiers » partait avec l'ancienne option (l'URL se met à jour après le tirage) et affichait une panne. Chaque tirage fige désormais ses options au moment du clic. Retour en haut immédiat (le défilement fluide était interrompu par le changement de hauteur).
- `npm run api:types` formate le fichier généré avec Biome : sans ça, chaque génération réécrivait tout le fichier.
- Faux stockages des tests partagés dans `src/test/storage.ts` (évite une copie entre carnet et roulette).
- Résultats : 116 tests .NET, 74 tests Vitest, 12 tests Playwright (bureau + mobile), CRAP max 6, Stryker Domain 86,2 % (un mutant du tirage tué par un test renforcé), Application 100 %, Api 94,6 %, jscpd 0 clone (back et front), build OK (JS 515 kB, 166 kB gzip).

## 2026-11-09 — Déploiement Azure

- Une seule App Service Linux (.NET 10, B1) pour l'API et le site : le front appelle `/api` et `/media` sur sa propre origine, donc pas de CORS ni de second hébergement. Static Web Apps écarté : l'API est une app ASP.NET Core, pas des Functions, et le lien vers un backend existant demande le plan Standard.
- L'API sert `wwwroot` (`UseDefaultFiles`, `UseStaticFiles`) et renvoie `index.html` pour toute page sans extension (routeur React). Repli explicite en 404 sous `/api` pour qu'une route inconnue ne réponde pas une page HTML. Tests : `SiteHostingTests`.
- Images : partage Azure Files monté sur `/mounts/media`, `Media:RootPath` pointé dessus. Aucun changement de code (le `LocalDiskMediaStore` lit un dossier). Un adaptateur Blob ne vaudra le coup que si les images doivent passer par un CDN.
- PostgreSQL Flexible Server B1ms, version 17, accès réservé aux services Azure. L'API utilise le compte administrateur en v1 ; un rôle applicatif dédié (ou l'authentification Entra) reste à faire.
- Migrations et seed au démarrage de l'API, comme en local : une seule instance, risque de course nul.
- Infra en Bicep (`infra/main.bicep`), mise en place par `infra/bootstrap.ps1`. Le mot de passe PostgreSQL est généré à chaque lancement et n'est ni affiché ni stocké hors d'Azure.
- CI/CD GitHub Actions, connexion à Azure par OIDC (aucun secret dans le dépôt). CrapSharp, Stryker, jscpd et Playwright restent des vérifications locales pour l'instant : trop lents ou outils pas encore publiés sur NuGet.


## 2026-11-09 — Étape 5 : multilingue

- Choix : dictionnaires TypeScript typés plutôt que react-i18next (prévu au plan). `fr.ts` est la référence, `Messages = typeof fr`, chaque langue doit avoir la même forme : une clé manquante casse la compilation. Pas de dépendance ajoutée ; pluriels et textes à variables écrits comme de petites fonctions. Coût : +30 kB de JS (les 5 langues sont chargées) — découpage reporté à l'étape 9 avec le reste du bundle.
- `messages.test.ts` vérifie à l'exécution, pour chaque langue : mêmes clés que le français, aucun texte vide, aucun texte resté en français (hors mots partagés listés). Vérifié en retirant une clé anglaise : le test la nomme.
- Verdicts, niveaux et catégories deviennent des codes (`veryPhobic`, `1`, `animals`) ; le texte vient du dictionnaire. Les titres de verdict sont neutres en genre en espagnol et en italien (« Fobia intensa », « Sin fobia ») et les boutons aussi (« No tengo fobia », « Non ho fobie »).
- Routes sous `/$lang`. `/` → langue enregistrée (`phobos.lang`), sinon langue du navigateur (fr-CA compte comme fr), sinon anglais (repli prévu au plan, plus utile qu'un français par défaut pour un visiteur qui ne lit aucune des 5 langues). Une adresse sans langue reçoit la préférence du visiteur, recherche comprise. Segments d'URL (`dossiers`, `mon-dossier`) non traduits ; à revoir avec le SEO (étape 9).
- Sélecteur de langue (liste FR/EN/ES/DE/IT) : même page dans l'autre langue, choix mémorisé. En plein parcours, le niveau atteint est conservé (`keepPreviousData`) ; dans la roulette, le dossier tiré est traduit au lieu d'en tirer un autre (tirage indépendant de la langue, détail lu par `phobiaQuery`).
- `<html lang>` et le titre de l'onglet suivent la langue ; dates au format local (`Intl`).
- Page « introuvable » commune aux dossiers inconnus et aux adresses inconnues.
- Accès au stockage du navigateur regroupé dans `browserStorage.ts` (trois copies auparavant).
- Trouvé dans le navigateur : la liste des langues était annoncée « FR » par les lecteurs d'écran → `aria-label`. Contrôle de débordement sur mobile (375 px) : 5 pages × 5 langues, aucun dépassement.
- Résultats : 107 tests Vitest, 28 tests Playwright (chaque page dans les 5 langues, redirection selon le navigateur, changement de langue mémorisé ; bureau + mobile), Biome propre, build OK (JS 544 kB, 176 kB gzip), jscpd 0 clone. Aucun changement côté .NET.

## 2026-11-09 — Parcours en cinq niveaux

- Quatre niveaux d'images suivis d'une vidéo YouTube au niveau 5 ; les anciennes vidéos enregistrées au niveau 3 sont présentées au niveau 5.
- Le dossier conserve son niveau numérique existant : une phobie est désormais considérée comme affrontée au niveau 5. Les verdicts et le profil tiennent compte des cinq niveaux.
- Les textes sont mis à jour dans les cinq langues. Les médias restent à créer et à renseigner.

## 2026-11-09 — Étape 6 : contenu en fichiers, sans base de données

- Décision (avec l'utilisateur) : back-office et statistiques enregistrées abandonnés ; plus rien n'écrit pendant que le site tourne, donc plus de base. SQLite écarté pour la même raison (un `.db` binaire ne se relit pas dans Git) et parce que SQLite sur le disque réseau d'App Service est fragile.
- Contenu : un fichier par phobie, `content/phobias/<slug>.json` (textes 5 langues, `images`, `video`, `published` facultatif). Fichiers embarqués dans `Phobos.Infrastructure`, chargés au démarrage par `PhobiaContent`, gardés en mémoire (`ContentPhobiaCatalogue`). Toute erreur arrête le chargement avec le nom du fichier : l'API ne démarre pas sur un contenu cassé. Le nom du fichier doit être le slug ; deux dossiers ne partagent pas un numéro.
- Lecture JSON stricte (`RespectRequiredConstructorParameters`, `RespectNullableAnnotations`) : un champ obligatoire absent ou `null` est refusé au lieu de passer en silence (trouvé par Stryker).
- Domaine : `ImageCredit` (IA, ou web avec licence et adresse http(s) obligatoires, auteur facultatif pour le domaine public) porté par chaque image. L'API renvoie `credit` (auteur, licence, lien) pour les images du web seulement ; le site l'affiche sous l'image (lien `noopener noreferrer`).
- Images : sources dans `media-src/` (hors git), `npm run media` (sharp 0.35.5, Apache-2.0) les convertit en WebP 1600 px max sans métadonnées dans `media/`, ne refait que ce qui a changé, liste les sources non déclarées avec l'entrée JSON à ajouter (`--declare-ai` les déclare comme images IA) et refuse de convertir si une image déclarée manque, a deux sources, ou vient du web sans licence. Logique de décision testée (`scripts/media-plan.ts`) ; le script complet essayé dans un dossier temporaire (`PHOBOS_ROOT`) : conversion 3000 → 1600 px, EXIF retiré, relance sans travail, erreur bloquante si une source disparaît.
- Retirés : EF Core, Npgsql, migrations, `PhobosDbContext`, seed, `dotnet-ef`, PostgreSQL de la CI et de `infra/main.bicep` (~15 €/mois), mot de passe généré par `bootstrap.ps1`. Domaine allégé de ce qu'EF imposait (`Id`, mutateurs privés). Le sélecteur de niveau de `PhobiaQueries` revient à `MediaForLevel` (la correction des vidéos anciennes « niveau 3 » ne servait qu'aux données en base).
- `infra/upload-media.ps1` : prépare puis envoie `media/` sur Azure Files, sans relancer toute l'infra. Bicep non compilé ici (Azure CLI absent de la machine) ; scripts PowerShell vérifiés par l'analyseur de PowerShell. Le serveur PostgreSQL déjà créé sur Azure n'est pas supprimé par Bicep (déploiement incrémental) : à supprimer à la main.
- Messages d'erreur désormais testés (ils sont lus par la personne qui édite le contenu) : chaque refus cite la valeur fautive. Survivants Stryker restants, équivalents : texte de repli `""` du nom d'image (refusé de toute façon), route `"/"` vs `""`, `UseDefaultFiles` (doublé par le repli vers `index.html`), `useAsync` du flux de fichier.
- Résultats : 151 tests .NET, CRAP max 6, Stryker Domain 100 %, Application 100 %, Infrastructure 97,0 %, Api 95,2 % ; 120 tests Vitest, Biome propre, build OK (JS 545 kB), jscpd 0 clone (back, front, scripts), 28 tests Playwright.

## 2026-11-10 — Premières images (5 phobies)

- Images IA générées pour araignées, serpents, insectes, cafards, abeilles et guêpes : 5 intensités (0 à 4) chacune, sélection décrite dans `media-generated/selection-phobies.md` avec les prompts (`prompts-generation.json`).
- Répartition sur les 4 niveaux d'images : intensité 0 → niveau 1, 1 → 2, 2 → 3, 3 et 4 → niveau 4 (deux images côte à côte, `4-a` et `4-b`).
- Les originaux et variantes étaient déposés dans `media/` (dossier de sortie du script) : déplacés dans `media-generated/` (hors git, archive), les 25 retenus copiés dans `media-src/<slug>/<niveau>-<lettre>.png`, puis `npm run media -- --declare-ai` : 25 entrées ajoutées aux 5 fichiers de contenu, 59 Mo de PNG → 4 Mo de WebP.
- À revoir : insectes intensité 0 (la coccinelle ne se voit pas) et serpents intensité 1 (serpent à peine visible).
- Vérifié : tests .NET (contenu valide), 25 images servies en 200 par l'API, parcours des araignées regardé dans le navigateur (niveaux 1 et 4), 28 tests Playwright.
