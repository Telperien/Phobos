import { describe, expect, it } from 'vitest'
import { declareGenerated, hasErrors, planMedia } from './media-plan.ts'

const ai = (file: string) => ({ level: Number(file.split('/')[1]?.[0]), file, origin: 'ai' })
const files = (sources: Record<string, number>, prepared: Record<string, number> = {}) => ({
  sources: new Map(Object.entries(sources)),
  prepared: new Map(Object.entries(prepared)),
})

describe('planMedia', () => {
  it('converts a declared image from its source, whatever the source format', () => {
    const plan = planMedia(
      [{ slug: 'arachnophobia', images: [ai('arachnophobia/1-a.webp'), ai('arachnophobia/2-a.webp')] }],
      files({ 'arachnophobia/1-a.png': 10, 'arachnophobia/2-a.JPG': 10 }),
    )

    expect(plan.convert).toEqual([
      { source: 'arachnophobia/1-a.png', target: 'arachnophobia/1-a.webp' },
      { source: 'arachnophobia/2-a.JPG', target: 'arachnophobia/2-a.webp' },
    ])
    expect(hasErrors(plan)).toBe(false)
  })

  it('leaves an image alone when it was prepared after its source last changed', () => {
    const plan = planMedia(
      [{ slug: 'arachnophobia', images: [ai('arachnophobia/1-a.webp'), ai('arachnophobia/1-b.webp')] }],
      files(
        { 'arachnophobia/1-a.png': 10, 'arachnophobia/1-b.png': 30 },
        { 'arachnophobia/1-a.webp': 20, 'arachnophobia/1-b.webp': 20 },
      ),
    )

    expect(plan.upToDate).toEqual(['arachnophobia/1-a.webp'])
    expect(plan.convert.map(({ target }) => target)).toEqual(['arachnophobia/1-b.webp'])
  })

  it('reports a declared image without source, or with two sources', () => {
    const plan = planMedia(
      [{ slug: 'arachnophobia', images: [ai('arachnophobia/1-a.webp'), ai('arachnophobia/2-a.webp')] }],
      files({ 'arachnophobia/2-a.png': 10, 'arachnophobia/2-a.jpg': 10 }),
    )

    expect(plan.missing).toEqual(['arachnophobia/1-a.webp'])
    expect(plan.ambiguous).toEqual(['arachnophobia/2-a.webp'])
    expect(plan.convert).toEqual([])
    expect(hasErrors(plan)).toBe(true)
  })

  it('refuses an image found on the web without its licence or its address', () => {
    const plan = planMedia(
      [
        {
          slug: 'arachnophobia',
          images: [
            { level: 1, file: 'arachnophobia/1-a.webp', origin: 'web', license: 'CC0' },
            { level: 1, file: 'arachnophobia/1-b.webp', origin: 'web', url: 'https://example.org/spider' },
            {
              level: 1,
              file: 'arachnophobia/1-c.webp',
              origin: 'web',
              license: 'CC0',
              url: 'https://example.org/a',
            },
          ],
        },
      ],
      files({ 'arachnophobia/1-a.png': 1, 'arachnophobia/1-b.png': 1, 'arachnophobia/1-c.png': 1 }),
    )

    expect(plan.uncredited).toEqual(['arachnophobia/1-a.webp', 'arachnophobia/1-b.webp'])
    expect(hasErrors(plan)).toBe(true)
  })

  it('lists the sources nobody declared, suggesting an entry when the name says where they go', () => {
    const plan = planMedia(
      [{ slug: 'arachnophobia', images: [] }],
      files({
        'arachnophobia/3-b.png': 1,
        'arachnophobia/spider.png': 1,
        'arachnophobia/5-a.png': 1,
        'unknown-fear/1-a.png': 1,
        'arachnophobia/notes.txt': 1,
      }),
    )

    expect(plan.undeclared).toEqual([
      {
        source: 'arachnophobia/3-b.png',
        suggestion: { slug: 'arachnophobia', level: 3, file: 'arachnophobia/3-b.webp' },
      },
      { source: 'arachnophobia/5-a.png', suggestion: null },
      { source: 'arachnophobia/spider.png', suggestion: null },
      { source: 'unknown-fear/1-a.png', suggestion: null },
    ])
    expect(hasErrors(plan)).toBe(false)
  })
})

describe('declareGenerated', () => {
  it('adds the suggested images as generated ones, in file order, keeping the existing entries', () => {
    const content = {
      slug: 'arachnophobia',
      images: [
        { level: 2, file: 'arachnophobia/2-a.webp', origin: 'web', license: 'CC0', url: 'https://x.org' },
      ],
      video: null,
    }

    const updated = declareGenerated(content, [
      { slug: 'arachnophobia', level: 3, file: 'arachnophobia/3-a.webp' },
      { slug: 'arachnophobia', level: 1, file: 'arachnophobia/1-a.webp' },
    ])

    expect(updated).toEqual({
      slug: 'arachnophobia',
      images: [
        { level: 1, file: 'arachnophobia/1-a.webp', origin: 'ai' },
        { level: 2, file: 'arachnophobia/2-a.webp', origin: 'web', license: 'CC0', url: 'https://x.org' },
        { level: 3, file: 'arachnophobia/3-a.webp', origin: 'ai' },
      ],
      video: null,
    })
  })
})
