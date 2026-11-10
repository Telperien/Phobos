import { describe, expect, it } from 'vitest'
import { reportVideos, statusFromOembed } from './video-check.ts'

describe('statusFromOembed', () => {
  it.each([
    [200, 'ok'],
    [401, 'not-embeddable'],
    [403, 'not-embeddable'],
    [400, 'gone'],
    [404, 'gone'],
    [429, 'unknown'],
    [500, 'unknown'],
  ] as const)('reads HTTP %i as %s', (status, expected) => {
    expect(statusFromOembed(status)).toBe(expected)
  })
})

describe('reportVideos', () => {
  it('passes when every video is online', () => {
    const report = reportVideos([
      { slug: 'arachnophobia', videoId: 'YgYhQ2mYVqU', status: 'ok' },
      { slug: 'acrophobia', videoId: '2IUuFM1ldbs', status: 'ok' },
    ])

    expect(report).toEqual({ failed: false, lines: ['2 vidéos vérifiées, toutes en ligne et intégrables.'] })
  })

  it('fails and names the phobias whose video is gone or no longer embeddable', () => {
    const report = reportVideos([
      { slug: 'arachnophobia', videoId: 'YgYhQ2mYVqU', status: 'ok' },
      { slug: 'acrophobia', videoId: '2IUuFM1ldbs', status: 'gone' },
      { slug: 'pyrophobia', videoId: 'S3DKqtbx3nc', status: 'not-embeddable' },
    ])

    expect(report.failed).toBe(true)
    expect(report.lines).toEqual([
      'acrophobia : vidéo 2IUuFM1ldbs disparue',
      'pyrophobia : vidéo S3DKqtbx3nc non intégrable',
      '3 vidéos vérifiées, 2 à remplacer dans content/phobias/.',
    ])
  })

  it('only warns about videos YouTube did not answer for, to avoid false alarms', () => {
    const report = reportVideos([{ slug: 'aerophobia', videoId: 'T7oE6NSKix0', status: 'unknown' }])

    expect(report).toEqual({
      failed: false,
      lines: [
        'aerophobia : vidéo T7oE6NSKix0 non vérifiée (YouTube n’a pas répondu)',
        '1 vidéo vérifiée, toutes en ligne et intégrables.',
      ],
    })
  })
})
