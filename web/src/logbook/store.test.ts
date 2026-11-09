import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LOGBOOK_KEY, readLogbook } from './logbook'
import { forgetEverything, reloadLogbook, saveExit, saveProgress, useLogbook } from './store'

describe('logbook store', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadLogbook()
  })

  it('saves to localStorage and refreshes the components that read it', () => {
    const { result } = renderHook(() => useLogbook())

    act(() => saveProgress('acrophobia', 3))
    act(() => saveExit('acrophobia', { level: 3, choice: 'stop' }))

    expect(result.current.acrophobia).toMatchObject({
      reachedLevel: 3,
      lastExit: { level: 3, choice: 'stop' },
    })
    expect(readLogbook(localStorage).acrophobia?.reachedLevel).toBe(3)
  })

  it('picks up changes made in another tab', () => {
    const { result } = renderHook(() => useLogbook())
    localStorage.setItem(
      LOGBOOK_KEY,
      JSON.stringify({
        version: 1,
        entries: { coulrophobia: { reachedLevel: 2, lastExit: null, updatedAt: '2026-11-09T00:00:00.000Z' } },
      }),
    )

    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOGBOOK_KEY })))

    expect(result.current.coulrophobia?.reachedLevel).toBe(2)
  })

  it('forgets everything', () => {
    const { result } = renderHook(() => useLogbook())
    act(() => saveProgress('acrophobia', 2))

    act(() => forgetEverything())

    expect(result.current).toEqual({})
    expect(localStorage.getItem(LOGBOOK_KEY)).toBeNull()
  })
})
