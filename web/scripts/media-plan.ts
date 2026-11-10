/**
 * What to do with the case file images: which sources to convert, which are up to date,
 * and what is wrong (missing source, two sources, web image without credit, undeclared source).
 * Paths are relative, with forward slashes: `arachnophobia/1-a.png` in media-src, `arachnophobia/1-a.webp` in media.
 */

export interface DeclaredImage {
  level: number
  file: string
  origin: string
  author?: string
  license?: string
  url?: string
}

export interface PhobiaImages {
  slug: string
  images: readonly DeclaredImage[]
}

/** Files found on disk, with their last modification time. */
export interface MediaFiles {
  sources: ReadonlyMap<string, number>
  prepared: ReadonlyMap<string, number>
}

export interface Suggestion {
  slug: string
  level: number
  file: string
}

export interface MediaPlan {
  convert: { source: string; target: string }[]
  upToDate: string[]
  missing: string[]
  ambiguous: string[]
  uncredited: string[]
  undeclared: { source: string; suggestion: Suggestion | null }[]
}

const SOURCE_EXTENSION = /\.(png|jpe?g|webp|avif)$/i
const NAMED_FOR_A_LEVEL = /^([a-z0-9]+(?:-[a-z0-9]+)*)\/([1-4])-([a-z])$/

const withoutExtension = (path: string) => path.replace(/\.[^./]+$/, '')

export function planMedia(phobias: readonly PhobiaImages[], files: MediaFiles): MediaPlan {
  const plan: MediaPlan = {
    convert: [],
    upToDate: [],
    missing: [],
    ambiguous: [],
    uncredited: [],
    undeclared: [],
  }
  const sources = [...files.sources.keys()].filter((source) => SOURCE_EXTENSION.test(source)).sort()
  const declared = new Set<string>()

  for (const image of phobias.flatMap((phobia) => phobia.images)) {
    const base = withoutExtension(image.file)
    declared.add(base)
    if (image.origin === 'web' && !(image.license?.trim() && image.url?.trim()))
      plan.uncredited.push(image.file)

    const matches = sources.filter((source) => withoutExtension(source) === base)
    const [source] = matches
    if (source === undefined) plan.missing.push(image.file)
    else if (matches.length > 1) plan.ambiguous.push(image.file)
    else if ((files.prepared.get(image.file) ?? -1) >= (files.sources.get(source) ?? 0))
      plan.upToDate.push(image.file)
    else plan.convert.push({ source, target: image.file })
  }

  const slugs = new Set(phobias.map((phobia) => phobia.slug))
  for (const source of sources.filter((path) => !declared.has(withoutExtension(path)))) {
    const [, slug = '', level, letter] = NAMED_FOR_A_LEVEL.exec(withoutExtension(source)) ?? []
    const suggestion = slugs.has(slug)
      ? { slug, level: Number(level), file: `${slug}/${level}-${letter}.webp` }
      : null
    plan.undeclared.push({ source, suggestion })
  }
  return plan
}

export const hasErrors = (plan: MediaPlan) =>
  plan.missing.length + plan.ambiguous.length + plan.uncredited.length > 0

/** The content file with the suggested images added as AI-generated ones, sorted by file name. */
export function declareGenerated<T extends { images: readonly DeclaredImage[] }>(
  content: T,
  suggestions: readonly Suggestion[],
): T {
  const added = suggestions.map(({ level, file }) => ({ level, file, origin: 'ai' }))
  const images = [...content.images, ...added].sort((a, b) => a.file.localeCompare(b.file))
  return { ...content, images }
}
