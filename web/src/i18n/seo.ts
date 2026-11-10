import { VERDICT_KINDS, type VerdictKind } from '../exposure/verdict'
import { LANGS, type Lang, LOCALES } from './languages'
import type { Messages } from './messages'

/** Texts the server needs to write each page's head (title, description, link previews). */
export interface SeoTexts {
  locale: string
  title: string
  description: string
  pages: { dossiers: string; roulette: string; 'mon-dossier': string }
  /** Word of each section in the addresses of this language (`case-files` for `dossiers`). */
  paths: Messages['paths']
  verdicts: Record<VerdictKind, string>
}

/**
 * Built into `seo.json` next to the site, read by the API: the interface messages stay the only source
 * of these texts, in every language.
 */
export function buildSeoTexts(messages: Record<Lang, Messages>): Record<Lang, SeoTexts> {
  const entries = LANGS.map((lang) => {
    const t = messages[lang]
    const texts: SeoTexts = {
      locale: LOCALES[lang].replace('-', '_'),
      title: t.meta.title,
      description: t.meta.description,
      pages: { dossiers: t.catalogue.title, roulette: t.nav.roulette, 'mon-dossier': t.myFile.title },
      paths: t.paths,
      verdicts: Object.fromEntries(
        VERDICT_KINDS.map((kind) => [kind, t.verdict.kinds[kind].title]),
      ) as Record<VerdictKind, string>,
    }
    return [lang, texts] as const
  })
  return Object.fromEntries(entries) as Record<Lang, SeoTexts>
}
