import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LangProvider } from '../i18n/context'
import { ImageCredit } from './ImageCredit'

const SOURCE = 'https://commons.wikimedia.org/wiki/File:Spider.jpg'

describe('ImageCredit', () => {
  it('names the author and the licence, linked to where the image comes from', () => {
    render(<ImageCredit credit={{ author: 'Jean Dupont', license: 'CC BY 4.0', sourceUrl: SOURCE }} />)

    const link = screen.getByRole('link', { name: 'Photo : Jean Dupont · CC BY 4.0' })
    expect(link).toHaveAttribute('href', SOURCE)
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('gives the licence alone when the author is unknown, in the interface language', () => {
    render(
      <LangProvider lang="en">
        <ImageCredit credit={{ author: null, license: 'Public domain', sourceUrl: SOURCE }} />
      </LangProvider>,
    )

    expect(screen.getByRole('link', { name: 'Photo · Public domain' })).toBeInTheDocument()
  })

  it('shows nothing for an image that owes no credit', () => {
    const { container } = render(<ImageCredit credit={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
