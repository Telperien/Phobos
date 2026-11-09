import { queryOptions } from '@tanstack/react-query'
import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

export type PhobiaSummary = components['schemas']['PhobiaSummary']
export type PhobiaDetail = components['schemas']['PhobiaDetail']
export type MediaView = components['schemas']['MediaView']

/** Interface language. Becomes a route parameter in step 5. */
export const LANG = 'fr'

const api = createClient<paths>({ baseUrl: window.location.origin })

export const catalogueQuery = (lang: string) =>
  queryOptions({
    queryKey: ['phobias', lang],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/{lang}/phobias', { params: { path: { lang } } })
      if (error !== undefined || data === undefined) throw new Error('Catalogue unavailable')
      return data
    },
    staleTime: 5 * 60_000,
  })

/** Resolves to null when the case file does not exist. */
export const phobiaQuery = (lang: string, slug: string) =>
  queryOptions({
    queryKey: ['phobia', lang, slug],
    queryFn: async () => {
      const { data, response } = await api.GET('/api/{lang}/phobias/{slug}', {
        params: { path: { lang, slug } },
      })
      if (response.status === 404) return null
      if (data === undefined) throw new Error(`Case file ${slug} unavailable`)
      return data
    },
    staleTime: 5 * 60_000,
  })

export async function drawPhobia(lang: string, seen: readonly string[]) {
  const { data } = await api.GET('/api/{lang}/phobias/random', {
    params: { path: { lang }, query: { seen: seen.join(',') || undefined } },
  })
  return data ?? null
}
