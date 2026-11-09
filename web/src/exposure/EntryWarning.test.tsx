import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { EntryWarning, WARNING_KEY } from './EntryWarning'

const renderGate = () =>
  render(
    <EntryWarning>
      <p>Contenu du dossier</p>
    </EntryWarning>,
  )

describe('EntryWarning', () => {
  beforeEach(() => localStorage.clear())

  it('shows the warning before the first case file', () => {
    renderGate()

    expect(screen.getByRole('heading', { name: /avant d’ouvrir/i })).toBeInTheDocument()
    expect(screen.queryByText('Contenu du dossier')).not.toBeInTheDocument()
  })

  it('opens the case file once accepted and remembers it', () => {
    renderGate()

    fireEvent.click(screen.getByRole('button', { name: /j’ai compris/i }))

    expect(screen.getByText('Contenu du dossier')).toBeInTheDocument()
    expect(localStorage.getItem(WARNING_KEY)).toBe('accepted')
  })

  it('does not ask again on later visits', () => {
    localStorage.setItem(WARNING_KEY, 'accepted')

    renderGate()

    expect(screen.getByText('Contenu du dossier')).toBeInTheDocument()
  })
})
