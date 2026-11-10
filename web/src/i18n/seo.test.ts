import { describe, expect, it } from 'vitest'
import { LANGS } from './languages'
import { MESSAGES } from './messages'
import { buildSeoTexts } from './seo'

describe('buildSeoTexts', () => {
  const texts = buildSeoTexts(MESSAGES)

  it('gives the server the page texts of every language', () => {
    expect(Object.keys(texts)).toEqual([...LANGS])
  })

  it('takes the texts from the interface messages, so they are never translated twice', () => {
    expect(texts.en).toEqual({
      locale: 'en_GB',
      title: MESSAGES.en.meta.title,
      description: MESSAGES.en.meta.description,
      pages: {
        dossiers: MESSAGES.en.catalogue.title,
        roulette: MESSAGES.en.nav.roulette,
        'mon-dossier': MESSAGES.en.myFile.title,
        'mentions-legales': MESSAGES.en.legal.title,
      },
      paths: MESSAGES.en.paths,
      verdicts: {
        veryPhobic: MESSAGES.en.verdict.kinds.veryPhobic.title,
        phobic: MESSAGES.en.verdict.kinds.phobic.title,
        sensitive: MESSAGES.en.verdict.kinds.sensitive.title,
        notPhobic: MESSAGES.en.verdict.kinds.notPhobic.title,
      },
    })
  })

  it('uses the Open Graph locale format', () => {
    expect(texts.fr.locale).toBe('fr_FR')
    expect(texts.de.locale).toBe('de_DE')
  })
})
