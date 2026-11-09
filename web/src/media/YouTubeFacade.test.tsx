import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { YouTubeFacade } from './YouTubeFacade'

describe('YouTubeFacade', () => {
  it('loads nothing from YouTube until the visitor asks for it', () => {
    render(<YouTubeFacade videoId="dQw4w9WgXcQ" startSeconds={12} title="Arachnophobie" />)

    expect(screen.queryByTitle(/vidéo/i)).not.toBeInTheDocument()
    expect(screen.getByText(/photosensibles/i)).toBeInTheDocument()
  })

  it('plays the privacy-enhanced embed from the chosen second once clicked', () => {
    render(<YouTubeFacade videoId="dQw4w9WgXcQ" startSeconds={12} title="Arachnophobie" />)

    fireEvent.click(screen.getByRole('button', { name: /lancer la vidéo/i }))

    const player = screen.getByTitle('Vidéo : Arachnophobie')
    expect(player).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&start=12&rel=0&modestbranding=1',
    )
  })
})
