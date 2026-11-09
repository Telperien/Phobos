import { describe, expect, it } from 'vitest'
import { brokenStorage, memoryStorage } from '../test/storage'
import {
  clearLogbook,
  EMPTY_LOGBOOK,
  facedSlugs,
  isFaced,
  LOGBOOK_KEY,
  readLogbook,
  recordExit,
  recordProgress,
  writeLogbook,
} from './logbook'

const NOW = new Date('2026-11-09T20:00:00Z')
const LATER = new Date('2026-11-10T08:30:00Z')

describe('recordProgress', () => {
  it('remembers the highest level reached', () => {
    let logbook = recordProgress(EMPTY_LOGBOOK, 'arachnophobia', 2, NOW)
    logbook = recordProgress(logbook, 'arachnophobia', 1, LATER)

    expect(logbook.arachnophobia).toEqual({ reachedLevel: 2, lastExit: null, updatedAt: LATER.toISOString() })
  })

  it('leaves other phobias untouched', () => {
    const logbook = recordProgress(
      recordProgress(EMPTY_LOGBOOK, 'acrophobia', 3, NOW),
      'arachnophobia',
      1,
      NOW,
    )

    expect(logbook.acrophobia.reachedLevel).toBe(3)
  })
})

describe('recordExit', () => {
  it('keeps the last exit and the highest level', () => {
    let logbook = recordExit(EMPTY_LOGBOOK, 'arachnophobia', { level: 3, choice: 'stop' }, NOW)
    logbook = recordExit(logbook, 'arachnophobia', { level: 1, choice: 'notPhobic' }, LATER)

    expect(logbook.arachnophobia).toEqual({
      reachedLevel: 3,
      lastExit: { level: 1, choice: 'notPhobic' },
      updatedAt: LATER.toISOString(),
    })
  })
})

describe('isFaced', () => {
  it('is true only once level 5 has been reached', () => {
    expect(isFaced(recordProgress(EMPTY_LOGBOOK, 'a', 5, NOW).a)).toBe(true)
    expect(isFaced(recordProgress(EMPTY_LOGBOOK, 'a', 4, NOW).a)).toBe(false)
    expect(isFaced(undefined)).toBe(false)
  })
})

describe('facedSlugs', () => {
  it('lists the phobias faced up to level 5', () => {
    let logbook = recordProgress(EMPTY_LOGBOOK, 'acrophobia', 5, NOW)
    logbook = recordProgress(logbook, 'coulrophobia', 2, NOW)
    logbook = recordExit(logbook, 'arachnophobia', { level: 5, choice: 'notPhobic' }, NOW)

    expect(facedSlugs(logbook)).toEqual(['acrophobia', 'arachnophobia'])
  })
})

describe('storage', () => {
  it('writes then reads back the same logbook', () => {
    const storage = memoryStorage()
    const logbook = recordExit(EMPTY_LOGBOOK, 'acrophobia', { level: 2, choice: 'stop' }, NOW)

    writeLogbook(storage, logbook)

    expect(readLogbook(storage)).toEqual(logbook)
    expect(JSON.parse(storage.items.get(LOGBOOK_KEY) ?? '')).toMatchObject({ version: 1 })
  })

  it.each([
    ['nothing stored', undefined],
    ['invalid JSON', '{oops'],
    ['another version', JSON.stringify({ version: 2, entries: { a: {} } })],
    ['entries that are not an object', JSON.stringify({ version: 1, entries: [] })],
  ])('starts empty when there is %s', (_, raw) => {
    const storage = memoryStorage(raw === undefined ? {} : { [LOGBOOK_KEY]: raw })

    expect(readLogbook(storage)).toEqual(EMPTY_LOGBOOK)
  })

  it('keeps working without storage (private browsing, blocked cookies)', () => {
    expect(readLogbook(brokenStorage)).toEqual(EMPTY_LOGBOOK)
    expect(readLogbook(null)).toEqual(EMPTY_LOGBOOK)
    expect(() => writeLogbook(brokenStorage, EMPTY_LOGBOOK)).not.toThrow()
    expect(() => clearLogbook(brokenStorage)).not.toThrow()
  })

  it('clears everything', () => {
    const storage = memoryStorage({ [LOGBOOK_KEY]: JSON.stringify({ version: 1, entries: {} }) })

    clearLogbook(storage)

    expect(storage.items.has(LOGBOOK_KEY)).toBe(false)
  })
})
