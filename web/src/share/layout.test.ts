import { describe, expect, it } from 'vitest'
import { fitFontSize, wrapLines } from './layout'

/** Every character is 10 px wide at size 10, and scales with the size. */
const measure = (text: string, size = 10) => text.length * size

describe('wrapLines', () => {
  it('fills each line with as many words as fit', () => {
    expect(wrapLines('Tu as tenu longtemps. La vidéo a eu raison de toi.', 210, measure)).toEqual([
      'Tu as tenu longtemps.',
      'La vidéo a eu raison',
      'de toi.',
    ])
  })

  it('keeps a word longer than the line on a line of its own', () => {
    expect(wrapLines('une SUBMÉCANOPHOBIE tenace', 100, measure)).toEqual([
      'une',
      'SUBMÉCANOPHOBIE',
      'tenace',
    ])
  })

  it('has no line for an empty text', () => {
    expect(wrapLines('   ', 100, measure)).toEqual([])
  })
})

describe('fitFontSize', () => {
  it('keeps the largest size that fits the width', () => {
    expect(fitFontSize('ARACHNOPHOBIE', 260, { largest: 30, smallest: 10 }, measure)).toBe(20)
  })

  it('never goes below the smallest size', () => {
    expect(fitFontSize('SUBMÉCANOPHOBIE', 50, { largest: 30, smallest: 12 }, measure)).toBe(12)
  })
})
