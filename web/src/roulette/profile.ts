import type { PhobiaSummary } from '../api/client'
import { CATEGORIES } from '../catalogue/categories'
import type { LevelNumber } from '../exposure/levels'
import { type ExitChoice, type Verdict, verdictFor } from '../exposure/verdict'
import { isFaced, type Logbook, type LogEntry } from '../logbook/logbook'

export interface FearProfile {
  opened: number
  faced: number
  verdicts: { title: string; tone: Verdict['tone']; count: number }[]
  /** Category code with the strongest reactions, or null when nothing scared the visitor. */
  dominantCategory: string | null
  worst: { slug: string; name: string; level: LevelNumber } | null
}

interface Opened {
  phobia: PhobiaSummary
  entry: LogEntry
}

const VERDICT_ORDER: { level: LevelNumber; choice: ExitChoice }[] = [
  { level: 1, choice: 'stop' },
  { level: 2, choice: 'stop' },
  { level: 3, choice: 'stop' },
  { level: 1, choice: 'notPhobic' },
]

/** An early stop says more about the fear than a late one; "not phobic" says nothing. */
const fearScore = ({ lastExit }: LogEntry) => (lastExit?.choice === 'stop' ? 4 - lastExit.level : 0)

/** Sums up the visitor's logbook: verdicts, most feared category, worst reaction. */
export function fearProfile(logbook: Logbook, catalogue: readonly PhobiaSummary[]): FearProfile {
  const opened = catalogue.flatMap((phobia) => {
    const entry = logbook[phobia.slug]
    return entry ? [{ phobia, entry }] : []
  })
  const titles = opened.flatMap(({ entry: { lastExit } }) =>
    lastExit ? [verdictFor(lastExit.level, lastExit.choice).title] : [],
  )

  return {
    opened: opened.length,
    faced: opened.filter(({ entry }) => isFaced(entry)).length,
    verdicts: VERDICT_ORDER.map(({ level, choice }) => {
      const { title, tone } = verdictFor(level, choice)
      return { title, tone, count: titles.filter((seen) => seen === title).length }
    }),
    dominantCategory: dominantCategory(opened),
    worst: worstReaction(opened),
  }
}

function dominantCategory(opened: readonly Opened[]) {
  let dominant: string | null = null
  let highest = 0
  for (const { code } of CATEGORIES) {
    const score = opened
      .filter(({ phobia }) => phobia.category === code)
      .reduce((sum, { entry }) => sum + fearScore(entry), 0)
    if (score > highest) {
      dominant = code
      highest = score
    }
  }
  return dominant
}

function worstReaction(opened: readonly Opened[]): FearProfile['worst'] {
  const [worst] = opened
    .filter(({ entry }) => fearScore(entry) > 0)
    .sort(
      (a, b) => fearScore(b.entry) - fearScore(a.entry) || b.entry.updatedAt.localeCompare(a.entry.updatedAt),
    )
  const level = worst?.entry.lastExit?.level
  return worst && level ? { slug: worst.phobia.slug, name: worst.phobia.name, level } : null
}
