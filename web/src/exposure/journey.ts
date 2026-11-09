import { FINAL_LEVEL, type LevelNumber } from './levels'
import type { ExitChoice } from './verdict'

export interface JourneyState {
  level: LevelNumber
  outcome: { level: LevelNumber; choice: ExitChoice } | null
}

export type JourneyAction = { type: 'next' } | { type: 'exit'; choice: ExitChoice } | { type: 'restart' }

export const START: JourneyState = { level: 1, outcome: null }

/** The exposure journey: climb levels 1 to 5, leave whenever you want, then it is over until restart. */
export function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  if (action.type === 'restart') return START
  if (state.outcome) return state
  if (action.type === 'exit') return { ...state, outcome: { level: state.level, choice: action.choice } }
  return state.level < FINAL_LEVEL ? { ...state, level: (state.level + 1) as LevelNumber } : state
}
