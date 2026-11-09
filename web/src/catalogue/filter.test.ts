import { describe, expect, it } from 'vitest'
import type { PhobiaSummary } from '../api/client'
import { EMPTY_LOGBOOK, recordProgress } from '../logbook/logbook'
import { ALL, filterCatalogue, parseCatalogueSearch, toCatalogueSearch } from './filter'

const summary = (slug: string, name: string, category: string, text = ''): PhobiaSummary => ({
  slug,
  caseNumber: 1,
  category,
  language: 'fr',
  name,
  etymology: '',
  summary: text,
})

const CATALOGUE = [
  summary('arachnophobia', 'Arachnophobie', 'animals', 'Peur des araignées.'),
  summary('acrophobia', 'Acrophobie', 'nature-and-spaces', 'Peur du vide et des hauteurs.'),
  summary('trypophobia', 'Trypophobie', 'body-and-health', 'Malaise face aux trous groupés.'),
]

const slugs = (list: PhobiaSummary[]) => list.map((phobia) => phobia.slug)

describe('filterCatalogue', () => {
  it('keeps everything by default', () => {
    expect(slugs(filterCatalogue(CATALOGUE, ALL, EMPTY_LOGBOOK))).toEqual([
      'arachnophobia',
      'acrophobia',
      'trypophobia',
    ])
  })

  it('narrows to one category', () => {
    expect(slugs(filterCatalogue(CATALOGUE, { ...ALL, category: 'animals' }, EMPTY_LOGBOOK))).toEqual([
      'arachnophobia',
    ])
  })

  it('searches names and summaries, ignoring case and accents', () => {
    expect(slugs(filterCatalogue(CATALOGUE, { ...ALL, query: 'ARAIGNEE' }, EMPTY_LOGBOOK))).toEqual([
      'arachnophobia',
    ])
    expect(slugs(filterCatalogue(CATALOGUE, { ...ALL, query: '  trypo ' }, EMPTY_LOGBOOK))).toEqual([
      'trypophobia',
    ])
  })

  it('separates the phobias faced from the ones still to try', () => {
    const logbook = recordProgress(
      recordProgress(EMPTY_LOGBOOK, 'acrophobia', 5, new Date()),
      'trypophobia',
      2,
      new Date(),
    )

    expect(slugs(filterCatalogue(CATALOGUE, { ...ALL, status: 'faced' }, logbook))).toEqual(['acrophobia'])
    expect(slugs(filterCatalogue(CATALOGUE, { ...ALL, status: 'todo' }, logbook))).toEqual([
      'arachnophobia',
      'trypophobia',
    ])
  })

  it('combines the filters', () => {
    const logbook = recordProgress(EMPTY_LOGBOOK, 'acrophobia', 5, new Date())

    expect(
      filterCatalogue(CATALOGUE, { category: 'nature-and-spaces', query: 'vide', status: 'todo' }, logbook),
    ).toEqual([])
  })
})

describe('parseCatalogueSearch', () => {
  it('reads a valid filter from the URL', () => {
    expect(parseCatalogueSearch({ category: 'strange', q: 'clown', status: 'faced' })).toEqual({
      category: 'strange',
      query: 'clown',
      status: 'faced',
    })
  })

  it('falls back to showing everything for missing or unknown values', () => {
    expect(parseCatalogueSearch({})).toEqual(ALL)
    expect(parseCatalogueSearch({ category: 'monsters', q: 42, status: 'maybe' })).toEqual(ALL)
  })
})

describe('toCatalogueSearch', () => {
  it('only keeps what differs from the default, for short URLs', () => {
    expect(toCatalogueSearch(ALL)).toEqual({})
    expect(toCatalogueSearch({ category: 'animals', query: '', status: 'todo' })).toEqual({
      category: 'animals',
      status: 'todo',
    })
  })
})
