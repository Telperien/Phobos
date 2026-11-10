import { describe, expect, it } from 'vitest'
import { LANGS } from './languages'
import { MESSAGES } from './messages'
import { publicPath, routePath } from './paths'

const SECTIONS = ['dossiers', 'roulette', 'mon-dossier'] as const

describe('publicPath', () => {
  it('writes the section in the language of the address', () => {
    expect(publicPath('/en/dossiers/arachnophobia')).toBe('/en/case-files/arachnophobia')
    expect(publicPath('/es/roulette')).toBe('/es/ruleta')
    expect(publicPath('/de/mon-dossier')).toBe('/de/meine-akte')
    expect(publicPath('/it/dossiers')).toBe('/it/fascicoli')
    expect(publicPath('/fr/dossiers/arachnophobia')).toBe('/fr/dossiers/arachnophobia')
  })

  it('leaves the home page, unknown pages and addresses without a language alone', () => {
    expect(publicPath('/en')).toBe('/en')
    expect(publicPath('/')).toBe('/')
    expect(publicPath('/en/unknown')).toBe('/en/unknown')
    expect(publicPath('/dossiers')).toBe('/dossiers')
  })

  it('only translates the section, never the case file', () => {
    expect(publicPath('/en/dossiers/roulette')).toBe('/en/case-files/roulette')
  })
})

describe('routePath', () => {
  it('reads the words of each language back into the routes of the site', () => {
    expect(routePath('/en/case-files/arachnophobia')).toBe('/en/dossiers/arachnophobia')
    expect(routePath('/es/ruleta')).toBe('/es/roulette')
    expect(routePath('/it/il-mio-fascicolo')).toBe('/it/mon-dossier')
  })

  it('still understands a word of another language, such as an old shared link', () => {
    expect(routePath('/en/dossiers/arachnophobia')).toBe('/en/dossiers/arachnophobia')
    expect(routePath('/de/case-files')).toBe('/de/dossiers')
    expect(routePath('/case-files')).toBe('/dossiers')
  })

  it('leaves unknown pages alone', () => {
    expect(routePath('/en/unknown')).toBe('/en/unknown')
    expect(routePath('/fr')).toBe('/fr')
  })

  it.each(LANGS)('gets back every route it wrote in %s', (lang) => {
    for (const section of SECTIONS) {
      expect(routePath(publicPath(`/${lang}/${section}/x`))).toBe(`/${lang}/${section}/x`)
    }
  })
})

describe('words of the addresses', () => {
  const words = LANGS.flatMap((lang) =>
    SECTIONS.map((section) => ({ lang, section, word: MESSAGES[lang].paths[section] })),
  )

  it('are safe in an address: lower case, no accents, hyphens only', () => {
    expect(words.filter(({ word }) => !/^[a-z]+(-[a-z]+)*$/.test(word))).toEqual([])
  })

  it('never name two sections, in any language, so an old link always leads to the right place', () => {
    const sectionsOf = new Map<string, Set<string>>()
    for (const { word, section } of words)
      sectionsOf.set(word, (sectionsOf.get(word) ?? new Set()).add(section))

    expect([...sectionsOf].filter(([, sections]) => sections.size > 1)).toEqual([])
  })

  it('are never a language code', () => {
    expect(words.filter(({ word }) => (LANGS as readonly string[]).includes(word))).toEqual([])
  })
})
