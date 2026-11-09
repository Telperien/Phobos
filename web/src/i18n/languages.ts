import { localStore } from '../browserStorage'

/** Interface languages, in the order the selector shows them. Same codes as the API. */
export const LANGS = ['fr', 'en', 'es', 'de', 'it'] as const
export type Lang = (typeof LANGS)[number]

/** Used when neither the visitor's choice nor the browser gives a supported language. */
export const FALLBACK_LANG: Lang = 'en'

export const LANG_KEY = 'phobos.lang'

/** Locale used for dates and numbers. */
export const LOCALES: Record<Lang, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
}

export const isLang = (code: unknown): code is Lang => LANGS.includes(code as Lang)

/** The visitor's saved choice first, then the browser languages (fr-CA counts as fr), then English. */
export function pickLanguage(saved: string | null, browserLanguages: readonly string[]): Lang {
  if (isLang(saved)) return saved
  const primary = browserLanguages.map((tag) => tag.split('-')[0]?.toLowerCase()).find(isLang)
  return primary ?? FALLBACK_LANG
}

/** The same address in another language: `/fr/dossiers` → `/de/dossiers`. */
export function pathInLanguage(pathname: string, lang: Lang) {
  const [, first = '', ...rest] = pathname.split('/')
  const segments = isLang(first) ? rest : [first, ...rest]
  return `/${[lang, ...segments.filter(Boolean)].join('/')}`
}

export function readSavedLanguage(storage: Pick<Storage, 'getItem'> | null) {
  try {
    return storage?.getItem(LANG_KEY) ?? null
  } catch {
    return null
  }
}

export function saveLanguage(storage: Pick<Storage, 'setItem'> | null, lang: Lang) {
  try {
    storage?.setItem(LANG_KEY, lang)
  } catch {
    // Storage blocked: the language is detected again on the next visit.
  }
}

/** Language for a visitor arriving without one in the address. */
export const preferredLanguage = () =>
  pickLanguage(readSavedLanguage(localStore()), navigator.languages ?? [])
