/** Whether each level 5 YouTube video can still be shown on the site, from YouTube's oEmbed answer. */

export type VideoStatus = 'ok' | 'not-embeddable' | 'gone' | 'unknown'

export interface VideoResult {
  slug: string
  videoId: string
  status: VideoStatus
}

/** oEmbed answers 200 for a video that can be embedded, 401/403 when embedding is off, 400/404 when it is gone. */
export function statusFromOembed(httpStatus: number): VideoStatus {
  if (httpStatus === 200) return 'ok'
  if (httpStatus === 401 || httpStatus === 403) return 'not-embeddable'
  if (httpStatus === 400 || httpStatus === 404) return 'gone'
  return 'unknown'
}

const PROBLEMS: Partial<Record<VideoStatus, string>> = {
  gone: 'disparue',
  'not-embeddable': 'non intégrable',
  unknown: 'non vérifiée (YouTube n’a pas répondu)',
}

/** Fails only on videos known to be gone or not embeddable: an unanswered check is a warning, not an alarm. */
export function reportVideos(results: readonly VideoResult[]): { failed: boolean; lines: string[] } {
  const lines = results.flatMap(({ slug, videoId, status }) =>
    status === 'ok' ? [] : [`${slug} : vidéo ${videoId} ${PROBLEMS[status]}`],
  )
  const broken = results.filter(({ status }) => status === 'gone' || status === 'not-embeddable').length
  const checked = `${results.length} vidéo${results.length > 1 ? 's' : ''} vérifiée${results.length > 1 ? 's' : ''}`
  lines.push(
    broken === 0
      ? `${checked}, toutes en ligne et intégrables.`
      : `${checked}, ${broken} à remplacer dans content/phobias/.`,
  )
  return { failed: broken > 0, lines }
}
