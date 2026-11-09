import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LangProvider } from '../i18n/context'
import { FearGauge } from './FearGauge'

describe('FearGauge', () => {
  it('exposes the current level as a meter', () => {
    render(<FearGauge level={2} />)

    const gauge = screen.getByRole('meter', { name: 'Jauge de frisson' })
    expect(gauge).toHaveAttribute('aria-valuemin', '1')
    expect(gauge).toHaveAttribute('aria-valuemax', '5')
    expect(gauge).toHaveAttribute('aria-valuenow', '2')
    expect(gauge).toHaveAttribute('aria-valuetext', 'Niveau 2 sur 5 : Approcher')
  })

  it('marks the levels reached so far', () => {
    render(<FearGauge level={2} />)

    expect(screen.getByText('Apprivoiser').closest('li')).toHaveAttribute('data-reached', 'true')
    expect(screen.getByText('Approcher').closest('li')).toHaveAttribute('data-reached', 'true')
    expect(screen.getByText('Affronter').closest('li')).toHaveAttribute('data-reached', 'false')
  })

  it('speaks the interface language', () => {
    render(
      <LangProvider lang="de">
        <FearGauge level={1} />
      </LangProvider>,
    )

    expect(screen.getByRole('meter', { name: 'Gänsehaut-Anzeige' })).toHaveAttribute(
      'aria-valuetext',
      'Stufe 1 von 5: Zähmen',
    )
  })
})
