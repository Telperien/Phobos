import type { LevelNumber } from './levels'

export type ExitChoice = 'notPhobic' | 'stop'

export interface Verdict {
  title: string
  detail: string
  tone: 'safe' | 'alarm'
}

const STOP_VERDICTS: Record<LevelNumber, Omit<Verdict, 'tone'>> = {
  1: { title: 'Très phobique', detail: 'Arrêt dès la première image. Le dossier reste ouvert.' },
  2: { title: 'Phobique', detail: 'Tu as tenu l’image douce, pas la suite.' },
  3: { title: 'Sensible', detail: 'Tu as tenu longtemps. La vidéo a eu raison de toi.' },
}

export function verdictFor(level: LevelNumber, choice: ExitChoice): Verdict {
  if (choice === 'notPhobic') {
    return { title: 'Pas phobique', detail: `Déclaré au niveau ${level}. On note, sans juger.`, tone: 'safe' }
  }
  return { ...STOP_VERDICTS[level], tone: 'alarm' }
}
