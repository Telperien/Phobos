import { useSyncExternalStore } from 'react'
import type { LevelNumber } from '../exposure/levels'
import type { ExitChoice } from '../exposure/verdict'
import {
  clearLogbook,
  EMPTY_LOGBOOK,
  LOGBOOK_KEY,
  type Logbook,
  readLogbook,
  recordExit,
  recordProgress,
  writeLogbook,
} from './logbook'

/** localStorage, or null when the browser refuses access to it. */
function browserStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

let current: Logbook = readLogbook(browserStorage())
const listeners = new Set<() => void>()

function publish(next: Logbook) {
  current = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === LOGBOOK_KEY || event.key === null) publish(readLogbook(browserStorage()))
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export const useLogbook = () => useSyncExternalStore(subscribe, () => current)

export const reloadLogbook = () => publish(readLogbook(browserStorage()))

function save(next: Logbook) {
  writeLogbook(browserStorage(), next)
  publish(next)
}

export const saveProgress = (slug: string, level: LevelNumber) =>
  save(recordProgress(current, slug, level, new Date()))

export const saveExit = (slug: string, exit: { level: LevelNumber; choice: ExitChoice }) =>
  save(recordExit(current, slug, exit, new Date()))

export function forgetEverything() {
  clearLogbook(browserStorage())
  publish(EMPTY_LOGBOOK)
}
