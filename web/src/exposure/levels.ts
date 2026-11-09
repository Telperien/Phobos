export type LevelNumber = 1 | 2 | 3

export interface ExposureLevel {
  number: LevelNumber
  name: string
  hint: string
}

export const EXPOSURE_LEVELS: readonly ExposureLevel[] = [
  { number: 1, name: 'Apprivoiser', hint: 'Une image douce, presque mignonne.' },
  { number: 2, name: 'Approcher', hint: 'Des images franches. Floutées tant que tu ne tiens pas.' },
  { number: 3, name: 'Affronter', hint: 'La vidéo. Sans filet.' },
]
