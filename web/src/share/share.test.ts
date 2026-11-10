import { describe, expect, it, vi } from 'vitest'
import { shareCard } from './share'

const file = new File(['png'], 'phobos-arachnophobia-sensitive.png', { type: 'image/png' })
const card = {
  file,
  title: 'Phobos',
  text: 'Arachnophobie : Sensible',
  url: 'https://phobos.test/fr/dossiers/arachnophobia',
}

describe('shareCard', () => {
  it('shares the image with its text and link when the browser can share files', async () => {
    const share = vi.fn(async () => {})
    const download = vi.fn()

    const outcome = await shareCard(card, { canShare: () => true, share }, download)

    expect(outcome).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files: [file], title: card.title, text: card.text, url: card.url })
    expect(download).not.toHaveBeenCalled()
  })

  it.each([
    ['cannot share at all', {}],
    ['cannot share files', { canShare: () => false, share: async () => {} }],
  ])('downloads the image when the browser %s', async (_, browser) => {
    const download = vi.fn()

    expect(await shareCard(card, browser, download)).toBe('downloaded')
    expect(download).toHaveBeenCalledWith(file)
  })

  it('does nothing more when the visitor closes the share sheet', async () => {
    const download = vi.fn()
    const share = async () => {
      throw new DOMException('Share canceled', 'AbortError')
    }

    expect(await shareCard(card, { canShare: () => true, share }, download)).toBe('cancelled')
    expect(download).not.toHaveBeenCalled()
  })

  it('falls back to downloading when sharing fails for another reason', async () => {
    const download = vi.fn()
    const share = async () => {
      throw new DOMException('Not allowed', 'NotAllowedError')
    }

    expect(await shareCard(card, { canShare: () => true, share }, download)).toBe('downloaded')
    expect(download).toHaveBeenCalledWith(file)
  })
})
