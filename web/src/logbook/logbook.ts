import { FINAL_LEVEL, type LevelNumber } from '../exposure/levels'
import type { ExitChoice } from '../exposure/verdict'

/**
 * Logbook kept in the visitor's browser (no account): for each phobia, the highest level reached
 * and the last way out. A phobia is "faced" once level 5 has been reached.
 */
export const LOGBOOK_KEY = 'phobos.logbook'
const VERSION = 1

export interface LogEntry {
  reachedLevel: LevelNumber
  lastExit: { level: LevelNumber; choice: ExitChoice } | null
  updatedAt: string
}

export type Logbook = Readonly<Record<string, LogEntry>>

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem' | 'removeItem'>

export const EMPTY_LOGBOOK: Logbook = {}

function update(logbook: Logbook, slug: string, level: LevelNumber, now: Date, exit?: LogEntry['lastExit']) {
  const previous = logbook[slug]
  const entry: LogEntry = {
    reachedLevel: Math.max(previous?.reachedLevel ?? 1, level) as LevelNumber,
    lastExit: exit === undefined ? (previous?.lastExit ?? null) : exit,
    updatedAt: now.toISOString(),
  }
  return { ...logbook, [slug]: entry }
}

export const recordProgress = (logbook: Logbook, slug: string, level: LevelNumber, now: Date): Logbook =>
  update(logbook, slug, level, now)

export const recordExit = (
  logbook: Logbook,
  slug: string,
  exit: { level: LevelNumber; choice: ExitChoice },
  now: Date,
): Logbook => update(logbook, slug, exit.level, now, exit)

export const isFaced = (entry: LogEntry | undefined) => entry?.reachedLevel === FINAL_LEVEL

export const facedSlugs = (logbook: Logbook) =>
  Object.entries(logbook)
    .filter(([, entry]) => isFaced(entry))
    .map(([slug]) => slug)

export function readLogbook(storage: ReadableStorage | null): Logbook {
  try {
    const stored = JSON.parse(storage?.getItem(LOGBOOK_KEY) ?? 'null')
    const valid =
      stored?.version === VERSION && typeof stored.entries === 'object' && !Array.isArray(stored.entries)
    return valid ? stored.entries : EMPTY_LOGBOOK
  } catch {
    return EMPTY_LOGBOOK
  }
}

export function writeLogbook(storage: WritableStorage | null, logbook: Logbook) {
  try {
    storage?.setItem(LOGBOOK_KEY, JSON.stringify({ version: VERSION, entries: logbook }))
  } catch {
    // Storage full or blocked: the site keeps working without memory.
  }
}

export function clearLogbook(storage: WritableStorage | null) {
  try {
    storage?.removeItem(LOGBOOK_KEY)
  } catch {
    // Same as above.
  }
}
