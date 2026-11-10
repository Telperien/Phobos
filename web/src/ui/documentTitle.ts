import { useEffect } from 'react'

/** Same format as the head written by the server (Phobos.Api/Site/PageHeads). */
export const pageTitle = (name: string) => `${name} — Phobos`

/** Sets the browser tab title; nothing happens while the page has no title yet (still loading). */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = title
  }, [title])
}
