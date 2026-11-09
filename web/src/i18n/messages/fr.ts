import type { CategoryCode } from '../../catalogue/categories'
import type { LevelNumber } from '../../exposure/levels'
import type { VerdictKind } from '../../exposure/verdict'

const s = (count: number) => (count > 1 ? 's' : '')

/** Every verdict text may use the level where the visitor stopped. */
export type VerdictTexts = Record<VerdictKind, { title: string; detail: (level: number) => string }>

const verdicts: VerdictTexts = {
  veryPhobic: {
    title: 'Très phobique',
    detail: () => 'Arrêt dès la première image. Le dossier reste ouvert.',
  },
  phobic: { title: 'Phobique', detail: () => 'Tu as tenu l’image douce, pas la suite.' },
  sensitive: { title: 'Sensible', detail: () => 'Tu as tenu longtemps avant de t’arrêter.' },
  notPhobic: {
    title: 'Pas phobique',
    detail: (level) => `Déclaré au niveau ${level}. On note, sans juger.`,
  },
}

/** Reference messages: every other language must have exactly the same shape (see `Messages`). */
export const fr = {
  meta: {
    title: 'Phobos — Trouve ta peur',
    languageName: 'Français',
  },
  nav: {
    tagline: 'Archives des peurs',
    archives: 'Archives',
    roulette: 'Roulette',
    myFile: 'Mon dossier',
    myFileShort: 'Moi',
    facedBadge: (count: number) => `${count} phobie${s(count)} affrontée${s(count)}`,
    language: 'Langue',
  },
  footer: {
    disclaimer:
      'Phobos n’est pas un outil de diagnostic. Si une peur t’empêche de vivre normalement, parles-en à un professionnel de santé.',
    opened: (date: string) => `Archives ouvertes le ${date}`,
  },
  status: {
    connecting: 'Connexion…',
    online: 'API en ligne',
    offline: 'API injoignable',
  },
  load: {
    failure: 'Les archives ne répondent pas. Quelqu’un a dû couper le courant.',
    retry: 'Réessayer',
  },
  categories: {
    animals: 'Animaux',
    'nature-and-spaces': 'Nature & espaces',
    'body-and-health': 'Corps & santé',
    strange: 'Étrange',
  } satisfies Record<CategoryCode, string>,
  levels: {
    1: { name: 'Apprivoiser', hint: 'Une image douce, presque mignonne.' },
    2: { name: 'Approcher', hint: 'Des images franches. Floutées tant que tu ne tiens pas.' },
    3: { name: 'Examiner', hint: 'Une image plus proche.' },
    4: { name: 'Confronter', hint: 'Une image intense.' },
    5: { name: 'Affronter', hint: 'La vidéo. Sans filet.' },
  } satisfies Record<LevelNumber, { name: string; hint: string }>,
  home: {
    kicker: 'Archives — 30 dossiers ouverts — Accès libre',
    title: { line1: 'Trouve', before: 'ta ', accent: 'peur', after: '.' },
    intro:
      'Trente phobies classées comme des dossiers de patients. Pour chacune, cinq niveaux d’exposition. Tu avances tant que tu tiens. Tu t’arrêtes quand tu veux.',
    openArchives: 'Ouvrir les archives',
    tryRoulette: 'Tenter la roulette',
    card: {
      file: 'Dossier N°???',
      patient: 'Patient : toi',
      phobia: 'Phobie',
      toBeDetermined: 'à déterminer',
      lines: ['Antécédents', 'Déclencheur', 'Réaction'],
      stamp: 'Confidentiel',
    },
    protocol: {
      title: 'Protocole',
      subtitle: 'Exposition graduée — 5 niveaux',
      exitsBefore: 'À chaque niveau, deux portes de sortie : ',
      or: ' ou ',
      exitsAfter: '. Le verdict tombe là où tu t’arrêtes.',
    },
    archives: {
      title: 'Dossiers',
      seeAll: (count: number) => `Voir les ${count} dossiers →`,
    },
    rouletteBand: {
      line1: 'Une peur au hasard.',
      line2: 'Puis une autre.',
      cta: 'Lancer la roulette',
    },
  },
  catalogue: {
    kicker: 'Archives — accès libre',
    title: 'Dossiers',
    loading: 'Ouverture des archives…',
    empty: 'Aucun dossier ne correspond. Les archives gardent leurs secrets.',
    faced: 'affrontées',
    search: 'Rechercher',
    searchPlaceholder: 'araignée, vide, clown…',
    statusLegend: 'Statut',
    status: { all: 'Toutes', faced: 'Affrontées', todo: 'À tenter' },
    categoryLegend: 'Catégorie',
    allCategories: 'Toutes catégories',
  },
  card: {
    label: (caseLabel: string, name: string, faced: boolean) =>
      `Dossier ${caseLabel}, ${name}${faced ? ' — affronté' : ''}`,
    exposure: 'Exposition 5 niv.',
    reached: (level: number) => `Niveau atteint : ${level} / 5`,
    neverOpened: 'Jamais ouvert',
  },
  caseFile: {
    loading: 'Ouverture du dossier…',
    back: '← Archives',
    file: (caseLabel: string) => `Dossier ${caseLabel}`,
    reference: (caseNumber: number) => `Réf. PHB-${caseNumber}`,
    note: (annotation: string) => `Note : ${annotation}`,
    reachedLevel: 'Niveau atteint',
    status: 'Statut',
    underObservation: 'En observation',
    neverExposed: 'Jamais exposé',
    faced: 'Affronté',
    next: 'Dossier suivant',
    missing: {
      stamp: 'Dossier introuvable',
      text: 'Ce dossier n’existe pas, ou quelqu’un l’a fait disparaître.',
      back: 'Retour aux archives',
    },
  },
  warning: {
    stamp: 'Lire avant exposition',
    title: 'Avant d’ouvrir les dossiers',
    points: [
      'Phobos est un jeu, pas un diagnostic médical.',
      'Les niveaux 2 à 5 montrent des images et des vidéos qui peuvent vraiment mettre mal à l’aise.',
      'Tu peux t’arrêter à tout moment, sans rien à prouver.',
      'Si une peur t’empêche de vivre normalement, parles-en à un médecin ou à un psychologue : les phobies se soignent très bien.',
    ],
    accept: 'J’ai compris, ouvrir le dossier',
  },
  journey: {
    gauge: 'Jauge de frisson',
    gaugeValue: (level: number, name: string) => `Niveau ${level} sur 5 : ${name}`,
    levelLabel: (level: number) => `Niveau 0${level} / 05`,
    next: 'Niveau suivant',
    notPhobic: 'Je ne suis pas phobique',
    stop: 'Pitié, on arrête ici',
    sensitive: 'Contenu sensible — niveaux 02 à 04',
    hold: 'Maintenir pour révéler',
    plate: (plate: string) => `Planche ${plate}`,
    imageAlt: (name: string, plate: string) => `${name}, planche ${plate}`,
    softPending: 'Image douce à venir.',
    harshPending: 'Images franches à venir. Profite du répit.',
    videoPending: 'Vidéo à venir. Le dossier est encore en cours d’instruction.',
  },
  video: {
    rec: '● Rec — Niveau 05',
    play: (title: string) => `Lancer la vidéo : ${title}`,
    frame: (title: string) => `Vidéo : ${title}`,
    warning: 'Avertissement : images rapides et sons forts. Déconseillé aux personnes photosensibles.',
  },
  verdict: {
    heading: (name: string) => `Verdict — ${name}`,
    restart: 'Recommencer',
    myFile: 'Mon dossier',
    kinds: verdicts,
  },
  myFile: {
    kicker: 'Dossier patient — conservé dans ce navigateur uniquement',
    title: 'Mon dossier',
    summary: (faced: number, opened: number) =>
      `${faced} phobie${s(faced)} affrontée${s(faced)} jusqu’au niveau 5, sur ${opened} dossier${s(opened)} ouvert${s(opened)}.`,
    loading: 'Lecture du dossier…',
    empty: 'Dossier vierge. Aucune exposition enregistrée pour l’instant.',
    openArchives: 'Ouvrir les archives',
    line: (level: number, date: string) => `Niveau ${level} / 5 · ${date}`,
    inProgress: 'En cours',
    faced: 'Affronté',
    forget: 'Effacer mon dossier',
    forgetConfirm: 'Tout effacer de ce navigateur ? Impossible de revenir en arrière.',
    forgetYes: 'Oui, tout effacer',
    forgetCancel: 'Annuler',
  },
  roulette: {
    label: 'Roulette',
    round: (round: number, draw: number) => `Tour ${round} · Tirage ${draw}`,
    skipFaced: 'Seulement celles que je n’ai pas encore affrontées',
    skip: 'Passer ce dossier →',
    spinning: 'La roulette tourne…',
    drawNext: 'Tirer la suivante',
    allFacedStamp: 'Tout affronté',
    allFaced: 'Chaque dossier a été affronté jusqu’au niveau 5 : il n’en reste aucun à tenter.',
    drawEverything: 'Tirer parmi tous les dossiers',
  },
  profile: {
    title: 'Ton profil de peurs',
    counts: (faced: number, total: number, opened: number) =>
      `${faced} / ${total} affrontées · ${opened} ouverte${s(opened)}`,
    empty: 'Profil vierge. Va au bout d’un premier dossier pour lancer l’analyse.',
    dominant: 'Peur dominante',
    noDominant: 'Aucune, pour l’instant',
    worst: 'Pire réaction',
    worstLine: (name: string, level: number) => `${name} — arrêt au niveau ${level}`,
    noWorst: 'Rien ne t’a fait reculer',
  },
}

/** Shape every language must follow: same keys, same functions. */
export type Messages = typeof fr
