import { describe, expect, it } from 'vitest'
import { brokenStorage, memoryStorage } from '../test/storage'
import { isLang, LANG_KEY, pathInLanguage, pickLanguage, readSavedLanguage, saveLanguage } from './languages'

describe('isLang', () => {
  it.each(['fr', 'en', 'es', 'de', 'it'])('accepts %s', (code) => {
    expect(isLang(code)).toBe(true)
  })

  it.each(['pt', 'FR', 'dossiers', '', undefined])('refuses %s', (code) => {
    expect(isLang(code)).toBe(false)
  })
})

describe('pickLanguage', () => {
  it('prefers the language the visitor chose before', () => {
    expect(pickLanguage('it', ['de-DE', 'fr'])).toBe('it')
  })

  it('otherwise takes the first supported browser language, regional variants included', () => {
    expect(pickLanguage(null, ['pt-BR', 'es-MX', 'fr-FR'])).toBe('es')
  })

  it('ignores a saved value that is not a supported language', () => {
    expect(pickLanguage('pt', ['de-AT'])).toBe('de')
  })

  it('falls back to English when nothing matches', () => {
    expect(pickLanguage(null, ['pt-BR', 'ja'])).toBe('en')
    expect(pickLanguage(null, [])).toBe('en')
  })
})

describe('pathInLanguage', () => {
  it('swaps the language prefix and keeps the rest of the address', () => {
    expect(pathInLanguage('/fr/dossiers/arachnophobia', 'de')).toBe('/de/dossiers/arachnophobia')
    expect(pathInLanguage('/fr', 'it')).toBe('/it')
  })

  it('adds the prefix to an address that has none', () => {
    expect(pathInLanguage('/dossiers', 'en')).toBe('/en/dossiers')
    expect(pathInLanguage('/', 'es')).toBe('/es')
  })
})

describe('saved language', () => {
  it('reads back the language it saved', () => {
    const storage = memoryStorage()

    saveLanguage(storage, 'es')

    expect(readSavedLanguage(storage)).toBe('es')
    expect(storage.items.get(LANG_KEY)).toBe('es')
  })

  it('reads nothing when the browser refuses storage', () => {
    expect(readSavedLanguage(brokenStorage)).toBeNull()
    expect(() => saveLanguage(brokenStorage, 'fr')).not.toThrow()
    expect(readSavedLanguage(null)).toBeNull()
  })
})
