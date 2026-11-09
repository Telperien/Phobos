import type { PhobiaSummary } from '../api/client'
import { isFaced, type Logbook } from '../logbook/logbook'
import { isCategoryCode } from './categories'

export interface CatalogueFilter {
  category: string
  query: string
  status: 'all' | 'faced' | 'todo'
}

export const ALL: CatalogueFilter = { category: 'all', query: '', status: 'all' }

/** Lowercase without accents, so "araignee" finds "araignées". */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

export function filterCatalogue(list: PhobiaSummary[], filter: CatalogueFilter, logbook: Logbook) {
  const query = normalize(filter.query)
  return list.filter((phobia) => {
    if (filter.category !== 'all' && phobia.category !== filter.category) return false
    if (query && !normalize(`${phobia.name} ${phobia.summary} ${phobia.slug}`).includes(query)) return false
    if (filter.status === 'all') return true
    return isFaced(logbook[phobia.slug]) === (filter.status === 'faced')
  })
}

export interface CatalogueSearch {
  category?: string
  q?: string
  status?: 'faced' | 'todo'
}

const STATUSES = new Set(['faced', 'todo'])

export function parseCatalogueSearch(search: Record<string, unknown>): CatalogueFilter {
  const { category, q, status } = search
  return {
    category: isCategoryCode(category) ? category : ALL.category,
    query: typeof q === 'string' ? q : ALL.query,
    status:
      typeof status === 'string' && STATUSES.has(status) ? (status as CatalogueFilter['status']) : ALL.status,
  }
}

export function toCatalogueSearch(filter: CatalogueFilter): CatalogueSearch {
  return {
    ...(filter.category !== ALL.category && { category: filter.category }),
    ...(filter.query !== ALL.query && { q: filter.query }),
    ...(filter.status !== 'all' && { status: filter.status }),
  }
}
