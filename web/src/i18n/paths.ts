import { isLang, LANGS, type Lang } from './languages'
import { MESSAGES, type Messages } from './messages'

/** Sections of the site, by the name of their route (`/$lang/dossiers`). */
type Section = keyof Messages['paths']

const isSection = (segment: string): segment is Section => Object.hasOwn(MESSAGES.fr.paths, segment)

/** Every language's word for a section, so an address written in any language still finds its page. */
const SECTION_OF_WORD = new Map(
  LANGS.flatMap((lang) => Object.entries(MESSAGES[lang].paths).map(([section, word]) => [word, section])),
)

/** Rewrites the segment after the language (or the first one, without a language). */
function rewriteSection(pathname: string, rewrite: (segment: string, lang: Lang | undefined) => string) {
  const segments = pathname.split('/')
  const lang = isLang(segments[1]) ? segments[1] : undefined
  const index = lang ? 2 : 1
  const segment = segments[index]
  if (segment) segments[index] = rewrite(segment, lang)
  return segments.join('/')
}

/** Address shown to the visitor: `/en/dossiers/arachnophobia` → `/en/case-files/arachnophobia`. */
export const publicPath = (pathname: string) =>
  rewriteSection(pathname, (segment, lang) =>
    lang && isSection(segment) ? MESSAGES[lang].paths[segment] : segment,
  )

/** Route of an address, whatever language its words are in: `/en/case-files` → `/en/dossiers`. */
export const routePath = (pathname: string) =>
  rewriteSection(pathname, (segment) => SECTION_OF_WORD.get(segment) ?? segment)
