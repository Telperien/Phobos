// Données factices pour la maquette de l'étape 1. Remplacées par l'API à l'étape 2.

export type Category = 'Animaux' | 'Nature & espaces' | 'Corps & santé' | 'Étrange'

export interface MockPhobia {
  slug: string
  caseNumber: number
  name: string
  scientificName: string
  category: Category
  summary: string
  description: string
  annotation: string
  stopRateAtLevel2: number
}

export const MOCK_PHOBIAS: readonly MockPhobia[] = [
  {
    slug: 'arachnophobie',
    caseNumber: 1,
    name: 'Arachnophobie',
    scientificName: 'du grec arákhnē, « araignée »',
    category: 'Animaux',
    summary: 'Peur des araignées.',
    description:
      'La plus répandue des phobies animales. Huit pattes, des mouvements imprévisibles, et un cerveau qui décide pour toi bien avant que tu aies le temps de réfléchir.',
    annotation: 'Le patient vérifie ses chaussures avant de les enfiler.',
    stopRateAtLevel2: 62,
  },
  {
    slug: 'thalassophobie',
    caseNumber: 6,
    name: 'Thalassophobie',
    scientificName: 'du grec thálassa, « mer »',
    category: 'Nature & espaces',
    summary: 'Peur des eaux profondes.',
    description:
      'Pas la peur de l’eau : la peur de ce qu’il y a dessous. Le bleu qui devient noir, l’immensité qu’on ne voit pas.',
    annotation: 'Refuse de nager là où il n’a pas pied.',
    stopRateAtLevel2: 48,
  },
  {
    slug: 'trypophobie',
    caseNumber: 26,
    name: 'Trypophobie',
    scientificName: 'du grec trúpa, « trou »',
    category: 'Corps & santé',
    summary: 'Malaise face aux trous groupés.',
    description:
      'Graines de lotus, éponges, nids d’abeilles. Une répulsion viscérale devant les motifs de petits trous serrés.',
    annotation: 'Démangeaisons signalées à la simple évocation.',
    stopRateAtLevel2: 71,
  },
  {
    slug: 'coulrophobie',
    caseNumber: 27,
    name: 'Coulrophobie',
    scientificName: 'du grec kōlobathristēs, « échassier »',
    category: 'Étrange',
    summary: 'Peur des clowns.',
    description:
      'Un sourire peint qui ne bouge jamais, des émotions qu’on ne peut pas lire. Le maquillage cache tout, c’est bien le problème.',
    annotation: 'A quitté un anniversaire en courant (1998).',
    stopRateAtLevel2: 39,
  },
  {
    slug: 'acrophobie',
    caseNumber: 14,
    name: 'Acrophobie',
    scientificName: 'du grec ákron, « sommet »',
    category: 'Nature & espaces',
    summary: 'Peur du vide et des hauteurs.',
    description:
      'Les jambes qui flanchent au bord d’un balcon, l’envie absurde de sauter. Le vertige n’est qu’un symptôme.',
    annotation: 'Prend l’escalier de service, côté mur.',
    stopRateAtLevel2: 55,
  },
  {
    slug: 'trypanophobie',
    caseNumber: 23,
    name: 'Trypanophobie',
    scientificName: 'du grec trúpanon, « foret »',
    category: 'Corps & santé',
    summary: 'Peur des aiguilles et des piqûres.',
    description:
      'Prise de sang, vaccin, piercing. Certains s’évanouissent avant même que l’aiguille ne touche la peau.',
    annotation: 'Regarde le plafond. Compte jusqu’à cent.',
    stopRateAtLevel2: 44,
  },
]

export function findMockPhobia(slug: string) {
  return MOCK_PHOBIAS.find((phobia) => phobia.slug === slug)
}

export const caseLabel = (caseNumber: number) => `N°${String(caseNumber).padStart(3, '0')}`
