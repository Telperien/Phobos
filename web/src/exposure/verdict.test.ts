import { describe, expect, it } from 'vitest'
import { verdictFor } from './verdict'

describe('verdictFor', () => {
  it.each([
    [1, 'veryPhobic'],
    [2, 'phobic'],
    [3, 'phobic'],
    [4, 'sensitive'],
    [5, 'sensitive'],
  ] as const)('stopping at level %i gives "%s"', (level, kind) => {
    expect(verdictFor(level, 'stop')).toEqual({ kind, tone: 'alarm' })
  })

  it.each([1, 2, 3, 4, 5] as const)('claiming not to be phobic at level %i gives "notPhobic"', (level) => {
    expect(verdictFor(level, 'notPhobic')).toEqual({ kind: 'notPhobic', tone: 'safe' })
  })
})
