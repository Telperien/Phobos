import type { LevelNumber } from './levels'

export type ExitChoice = 'notPhobic' | 'stop'

/** In order from the strongest reaction to none. The wording lives in the messages. */
export const VERDICT_KINDS = ['veryPhobic', 'phobic', 'sensitive', 'notPhobic'] as const
export type VerdictKind = (typeof VERDICT_KINDS)[number]

export interface Verdict {
  kind: VerdictKind
  tone: 'safe' | 'alarm'
}

const STOP_KINDS: Record<LevelNumber, VerdictKind> = {
  1: 'veryPhobic',
  2: 'phobic',
  3: 'phobic',
  4: 'sensitive',
  5: 'sensitive',
}

export const toneOf = (kind: VerdictKind): Verdict['tone'] => (kind === 'notPhobic' ? 'safe' : 'alarm')

export function verdictFor(level: LevelNumber, choice: ExitChoice): Verdict {
  const kind = choice === 'notPhobic' ? 'notPhobic' : STOP_KINDS[level]
  return { kind, tone: toneOf(kind) }
}
