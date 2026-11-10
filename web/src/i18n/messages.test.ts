import { describe, expect, it } from 'vitest'
import { LANGS } from './languages'
import { MESSAGES } from './messages'

type Leaf = { path: string; value: unknown }

/** Every string or function in a message tree, with its dotted path. */
function leaves(tree: unknown, path = ''): Leaf[] {
  if (tree !== null && typeof tree === 'object') {
    return Object.entries(tree).flatMap(([key, value]) => leaves(value, path ? `${path}.${key}` : key))
  }
  return [{ path, value: tree }]
}

/** Calls a message function with sample arguments, so its text can be checked too. */
const textOf = (value: unknown) =>
  typeof value === 'function' ? String(value(2, 7, 3)) : typeof value === 'string' ? value : undefined

const reference = leaves(MESSAGES.fr)
const referenceKinds = Object.fromEntries(reference.map(({ path, value }) => [path, typeof value]))

/** Texts that are allowed to read the same as in French (shared words, punctuation). */
const SAME_AS_FRENCH: Partial<Record<string, readonly string[]>> = {
  en: [
    'home.title.after',
    'nav.archives',
    'nav.roulette',
    'paths.roulette',
    'caseFile.back',
    'verdict.heading',
    'roulette.label',
  ],
  es: ['home.title.after'],
  de: ['home.title.after', 'nav.roulette', 'paths.roulette', 'home.card.phobia', 'roulette.label'],
  it: ['home.title.after', 'nav.roulette', 'paths.roulette', 'roulette.label'],
}

describe.each(LANGS)('messages in %s', (lang) => {
  const messages = leaves(MESSAGES[lang])

  it('have exactly the keys of the French reference, with the same kind of value', () => {
    expect(Object.fromEntries(messages.map(({ path, value }) => [path, typeof value]))).toEqual(
      referenceKinds,
    )
  })

  it('have no empty text', () => {
    const empty = messages.filter(({ value }) => !textOf(value)?.trim()).map(({ path }) => path)

    expect(empty).toEqual([])
  })
})

describe.each(LANGS.filter((lang) => lang !== 'fr'))('messages in %s', (lang) => {
  it('do not leave French text untranslated', () => {
    const messages = leaves(MESSAGES[lang])
    const french = new Map(reference.map(({ path, value }) => [path, textOf(value)]))
    const untranslated = messages
      .filter(({ path, value }) => textOf(value) === french.get(path))
      .map(({ path }) => path)
      .filter((path) => !SAME_AS_FRENCH[lang]?.includes(path))

    expect(untranslated).toEqual([])
  })
})

it('names each language in its own words, once', () => {
  const names = LANGS.map((lang) => MESSAGES[lang].meta.languageName)

  expect(new Set(names).size).toBe(LANGS.length)
})
