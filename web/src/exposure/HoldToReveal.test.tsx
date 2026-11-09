import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HoldToReveal } from './HoldToReveal'

function renderHold(onReveal = vi.fn()) {
  render(
    <HoldToReveal durationMs={1000} onReveal={onReveal}>
      <img alt="Araignée en gros plan" src="/x.webp" />
    </HoldToReveal>,
  )
  return { onReveal, trigger: screen.getByRole('button', { name: /maintenir pour révéler/i }) }
}

const media = () => screen.getByTestId('hold-to-reveal-media')

describe('HoldToReveal', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('hides the content until it is held long enough', () => {
    const { trigger, onReveal } = renderHold()

    fireEvent.pointerDown(trigger)
    act(() => vi.advanceTimersByTime(999))
    expect(media()).toHaveAttribute('data-revealed', 'false')

    act(() => vi.advanceTimersByTime(1))
    expect(media()).toHaveAttribute('data-revealed', 'true')
    expect(onReveal).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: /maintenir/i })).not.toBeInTheDocument()
  })

  it('stays hidden when released too early', () => {
    const { trigger, onReveal } = renderHold()

    fireEvent.pointerDown(trigger)
    act(() => vi.advanceTimersByTime(600))
    fireEvent.pointerUp(trigger)
    act(() => vi.advanceTimersByTime(1000))

    expect(media()).toHaveAttribute('data-revealed', 'false')
    expect(onReveal).not.toHaveBeenCalled()
  })

  it('stays hidden when the pointer leaves the button', () => {
    const { trigger } = renderHold()

    fireEvent.pointerDown(trigger)
    fireEvent.pointerLeave(trigger)
    act(() => vi.advanceTimersByTime(1000))

    expect(media()).toHaveAttribute('data-revealed', 'false')
  })

  it('can be held with the keyboard', () => {
    const { trigger } = renderHold()

    fireEvent.keyDown(trigger, { key: ' ' })
    act(() => vi.advanceTimersByTime(1000))

    expect(media()).toHaveAttribute('data-revealed', 'true')
  })

  it('ignores keys other than space and enter', () => {
    const { trigger } = renderHold()

    fireEvent.keyDown(trigger, { key: 'a' })
    act(() => vi.advanceTimersByTime(1000))

    expect(media()).toHaveAttribute('data-revealed', 'false')
  })

  it('stays hidden when the key is released too early', () => {
    const { trigger } = renderHold()

    fireEvent.keyDown(trigger, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(500))
    fireEvent.keyUp(trigger, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(1000))

    expect(media()).toHaveAttribute('data-revealed', 'false')
  })
})
