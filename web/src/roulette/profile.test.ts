import { describe, expect, it } from 'vitest'
import type { PhobiaSummary } from '../api/client'
import type { LogEntry } from '../logbook/logbook'
import { fearProfile } from './profile'

const summary = (slug: string, category: string): PhobiaSummary => ({
  slug,
  caseNumber: 1,
  category,
  language: 'fr',
  name: `Nom de ${slug}`,
  etymology: '',
  summary: '',
})

const CATALOGUE = [
  summary('arachnophobia', 'animals'),
  summary('ophidiophobia', 'animals'),
  summary('acrophobia', 'nature-and-spaces'),
  summary('trypophobia', 'body-and-health'),
  summary('coulrophobia', 'strange'),
  summary('pediophobia', 'strange'),
]

const stoppedAt = (level: 1 | 2 | 3, updatedAt = '2026-11-09T20:00:00Z'): LogEntry => ({
  reachedLevel: level,
  lastExit: { level, choice: 'stop' },
  updatedAt,
})

describe('fearProfile', () => {
  it('has nothing to say about an empty logbook', () => {
    expect(fearProfile({}, CATALOGUE)).toEqual({
      opened: 0,
      faced: 0,
      verdicts: [
        { title: 'Très phobique', tone: 'alarm', count: 0 },
        { title: 'Phobique', tone: 'alarm', count: 0 },
        { title: 'Sensible', tone: 'alarm', count: 0 },
        { title: 'Pas phobique', tone: 'safe', count: 0 },
      ],
      dominantCategory: null,
      worst: null,
    })
  })

  it('counts the verdicts, names the most feared category and the worst reaction', () => {
    const profile = fearProfile(
      {
        arachnophobia: stoppedAt(1),
        ophidiophobia: stoppedAt(2),
        acrophobia: stoppedAt(3),
        coulrophobia: {
          reachedLevel: 3,
          lastExit: { level: 3, choice: 'notPhobic' },
          updatedAt: '2026-11-09T20:00:00Z',
        },
        trypophobia: { reachedLevel: 2, lastExit: null, updatedAt: '2026-11-09T20:00:00Z' },
        'removed-phobia': stoppedAt(1),
      },
      CATALOGUE,
    )

    expect(profile.opened).toBe(5)
    expect(profile.faced).toBe(2)
    expect(profile.verdicts.map(({ count }) => count)).toEqual([1, 1, 1, 1])
    expect(profile.dominantCategory).toBe('animals')
    expect(profile.worst).toEqual({ slug: 'arachnophobia', name: 'Nom de arachnophobia', level: 1 })
  })

  it('weighs an early stop more than a late one', () => {
    const profile = fearProfile(
      { coulrophobia: stoppedAt(1), arachnophobia: stoppedAt(3), ophidiophobia: stoppedAt(3) },
      CATALOGUE,
    )

    expect(profile.dominantCategory).toBe('strange')
  })

  it('breaks a tie between categories in catalogue order', () => {
    const profile = fearProfile({ pediophobia: stoppedAt(2), acrophobia: stoppedAt(2) }, CATALOGUE)

    expect(profile.dominantCategory).toBe('nature-and-spaces')
  })

  it('picks the most recent reaction among equally bad ones', () => {
    const profile = fearProfile(
      {
        arachnophobia: stoppedAt(1, '2026-11-08T10:00:00Z'),
        coulrophobia: stoppedAt(1, '2026-11-09T10:00:00Z'),
        acrophobia: stoppedAt(1, '2026-11-07T10:00:00Z'),
      },
      CATALOGUE,
    )

    expect(profile.worst?.slug).toBe('coulrophobia')
  })

  it('sees no fear in a visitor who is never phobic', () => {
    const profile = fearProfile(
      {
        arachnophobia: {
          reachedLevel: 1,
          lastExit: { level: 1, choice: 'notPhobic' },
          updatedAt: '2026-11-09T20:00:00Z',
        },
      },
      CATALOGUE,
    )

    expect(profile.dominantCategory).toBeNull()
    expect(profile.worst).toBeNull()
  })
})
