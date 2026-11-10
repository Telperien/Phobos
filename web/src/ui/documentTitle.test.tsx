import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { pageTitle, useDocumentTitle } from './documentTitle'

describe('document title', () => {
  it('names a page like the server does, so the tab keeps the same title once the site has loaded', () => {
    expect(pageTitle('Arachnophobie')).toBe('Arachnophobie — Phobos')
  })

  it('sets the tab title, and leaves it alone while the page has none yet', () => {
    document.title = 'Phobos — Trouve ta peur'
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: undefined as string | undefined },
    })
    expect(document.title).toBe('Phobos — Trouve ta peur')

    rerender({ title: 'Arachnophobie — Phobos' })

    expect(document.title).toBe('Arachnophobie — Phobos')
  })
})
