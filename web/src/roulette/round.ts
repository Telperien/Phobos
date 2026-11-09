/**
 * Roulette round kept for the browser tab (sessionStorage): the case files already drawn, oldest first.
 * The API draws among the others; once it serves one already seen, a new round has started.
 */
export const ROUND_KEY = 'phobos.roulette'
const VERSION = 1

export interface Round {
  number: number
  seen: readonly string[]
}

export const FIRST_ROUND: Round = { number: 1, seen: [] }

type RoundStorage = Pick<Storage, 'getItem' | 'setItem'>

export const afterDraw = (round: Round, slug: string): Round =>
  round.seen.includes(slug)
    ? { number: round.number + 1, seen: [slug] }
    : { number: round.number, seen: [...round.seen, slug] }

const isRound = (value: { number?: unknown; seen?: unknown }): value is Round =>
  Number.isInteger(value.number) &&
  (value.number as number) > 0 &&
  Array.isArray(value.seen) &&
  value.seen.every((slug) => typeof slug === 'string')

export function readRound(storage: Pick<Storage, 'getItem'> | null): Round {
  try {
    const stored = JSON.parse(storage?.getItem(ROUND_KEY) ?? 'null')
    return stored?.version === VERSION && isRound(stored)
      ? { number: stored.number, seen: stored.seen }
      : FIRST_ROUND
  } catch {
    return FIRST_ROUND
  }
}

export function writeRound(storage: Pick<Storage, 'setItem'> | null, round: Round) {
  try {
    storage?.setItem(ROUND_KEY, JSON.stringify({ version: VERSION, ...round }))
  } catch {
    // Storage blocked: the roulette still works, it just forgets the round on reload.
  }
}

/** Draws the next case file of the round and remembers it. */
export async function spin<T extends { slug: string }>(
  storage: RoundStorage | null,
  draw: (seen: readonly string[]) => Promise<T | null>,
): Promise<{ phobia: T | null; round: Round }> {
  const round = readRound(storage)
  const phobia = await draw(round.seen)
  if (phobia === null) return { phobia, round }

  const next = afterDraw(round, phobia.slug)
  writeRound(storage, next)
  return { phobia, round: next }
}

export interface RouletteSearch {
  skipFaced?: true
}

export const parseRouletteSearch = (search: Record<string, unknown>) => ({
  skipFaced: search.skipFaced === true || search.skipFaced === 'true',
})

export const toRouletteSearch = ({ skipFaced }: { skipFaced: boolean }): RouletteSearch =>
  skipFaced ? { skipFaced: true } : {}
