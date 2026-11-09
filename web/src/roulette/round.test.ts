import { describe, expect, it, vi } from 'vitest'
import { brokenStorage, memoryStorage } from '../test/storage'
import {
  afterDraw,
  FIRST_ROUND,
  parseRouletteSearch,
  ROUND_KEY,
  readRound,
  spin,
  toRouletteSearch,
  writeRound,
} from './round'

describe('afterDraw', () => {
  it('adds the drawn case file to the current round', () => {
    expect(afterDraw({ number: 1, seen: ['acrophobia'] }, 'coulrophobia')).toEqual({
      number: 1,
      seen: ['acrophobia', 'coulrophobia'],
    })
  })

  it('starts the next round when the API serves a case file already seen in this one', () => {
    expect(afterDraw({ number: 1, seen: ['acrophobia', 'coulrophobia'] }, 'acrophobia')).toEqual({
      number: 2,
      seen: ['acrophobia'],
    })
  })
})

describe('round storage', () => {
  it('reads back the round it wrote', () => {
    const storage = memoryStorage()

    writeRound(storage, { number: 3, seen: ['acrophobia'] })

    expect(readRound(storage)).toEqual({ number: 3, seen: ['acrophobia'] })
  })

  it.each([
    ['nothing stored', undefined],
    ['invalid JSON', '{oops'],
    ['another format version', JSON.stringify({ version: 2, number: 1, seen: [] })],
    ['a round number that is not a positive integer', JSON.stringify({ version: 1, number: 0, seen: [] })],
    ['seen slugs that are not strings', JSON.stringify({ version: 1, number: 1, seen: [4] })],
  ])('starts from the first round with %s', (_, raw) => {
    const storage = memoryStorage(raw === undefined ? {} : { [ROUND_KEY]: raw })

    expect(readRound(storage)).toEqual(FIRST_ROUND)
  })

  it('keeps working when the browser refuses storage', () => {
    expect(readRound(brokenStorage)).toEqual(FIRST_ROUND)
    expect(() => writeRound(brokenStorage, FIRST_ROUND)).not.toThrow()
    expect(readRound(null)).toEqual(FIRST_ROUND)
  })
})

describe('spin', () => {
  it('draws among the case files not seen yet and remembers the drawn one', async () => {
    const storage = memoryStorage()
    writeRound(storage, { number: 1, seen: ['acrophobia'] })
    const draw = vi.fn(async () => ({ slug: 'coulrophobia' }))

    const result = await spin(storage, draw)

    expect(draw).toHaveBeenCalledWith(['acrophobia'])
    expect(result).toEqual({
      phobia: { slug: 'coulrophobia' },
      round: { number: 1, seen: ['acrophobia', 'coulrophobia'] },
    })
    expect(readRound(storage)).toEqual(result.round)
  })

  it('leaves the round untouched when there is nothing left to draw', async () => {
    const storage = memoryStorage()
    writeRound(storage, { number: 2, seen: ['acrophobia'] })

    const result = await spin(storage, async () => null)

    expect(result).toEqual({ phobia: null, round: { number: 2, seen: ['acrophobia'] } })
  })

  it('serves thirty different case files before reshuffling, with an API that draws without repetition', async () => {
    const deck = Array.from({ length: 30 }, (_, index) => `phobia-${index + 1}`)
    const api = async (seen: readonly string[]) => {
      const unseen = deck.filter((slug) => !seen.includes(slug))
      const pool = unseen.length > 0 ? unseen : deck.filter((slug) => slug !== seen.at(-1))
      return { slug: pool[pool.length - 1] as string }
    }
    const storage = memoryStorage()

    const drawn: string[] = []
    for (let draw = 0; draw < 31; draw++) drawn.push((await spin(storage, api)).phobia?.slug as string)

    expect(new Set(drawn.slice(0, 30)).size).toBe(30)
    expect(drawn[30]).not.toBe(drawn[29])
    expect(readRound(storage)).toEqual({ number: 2, seen: [drawn[30]] })
  })
})

describe('roulette search', () => {
  it.each([
    [{ skipFaced: true }, true],
    [{ skipFaced: 'true' }, true],
    [{ skipFaced: false }, false],
    [{ skipFaced: 'yes' }, false],
    [{}, false],
  ])('reads %o as skipFaced = %s', (search, skipFaced) => {
    expect(parseRouletteSearch(search)).toEqual({ skipFaced })
  })

  it('keeps the URL clean when every case file is allowed', () => {
    expect(toRouletteSearch({ skipFaced: false })).toEqual({})
    expect(toRouletteSearch({ skipFaced: true })).toEqual({ skipFaced: true })
  })
})
