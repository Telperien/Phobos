import { describe, expect, it } from 'vitest'
import { type JourneyAction, journeyReducer, START } from './journey'

const play = (...actions: JourneyAction[]) => actions.reduce(journeyReducer, START)

describe('journeyReducer', () => {
  it('starts at level 1 with no outcome', () => {
    expect(START).toEqual({ level: 1, outcome: null })
  })

  it('climbs one level at a time up to level 3', () => {
    expect(play({ type: 'next' }).level).toBe(2)
    expect(play({ type: 'next' }, { type: 'next' }).level).toBe(3)
    expect(play({ type: 'next' }, { type: 'next' }, { type: 'next' }).level).toBe(3)
  })

  it('records the exit at the current level', () => {
    expect(play({ type: 'next' }, { type: 'exit', choice: 'stop' }).outcome).toEqual({
      level: 2,
      choice: 'stop',
    })
  })

  it('ignores any move once the journey is over', () => {
    const over = play({ type: 'exit', choice: 'notPhobic' })

    expect(journeyReducer(over, { type: 'next' })).toBe(over)
    expect(journeyReducer(over, { type: 'exit', choice: 'stop' })).toBe(over)
  })

  it('restarts from level 1', () => {
    expect(play({ type: 'next' }, { type: 'exit', choice: 'stop' }, { type: 'restart' })).toEqual(START)
  })
})
