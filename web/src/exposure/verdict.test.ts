import { describe, expect, it } from 'vitest'
import { verdictFor } from './verdict'

describe('verdictFor', () => {
  it.each([
    [1, 'Très phobique'],
    [2, 'Phobique'],
    [3, 'Sensible'],
  ] as const)('stopping at level %i gives "%s"', (level, title) => {
    expect(verdictFor(level, 'stop').title).toBe(title)
  })

  it.each([1, 2, 3] as const)('claiming not to be phobic at level %i gives "Pas phobique"', (level) => {
    expect(verdictFor(level, 'notPhobic')).toMatchObject({ title: 'Pas phobique', tone: 'safe' })
  })

  it('flags stops as alarming', () => {
    expect(verdictFor(2, 'stop').tone).toBe('alarm')
  })
})
