/** Browser storages, or null when the browser refuses access (private mode, blocked site data). */
export function localStore() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function sessionStore() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}
