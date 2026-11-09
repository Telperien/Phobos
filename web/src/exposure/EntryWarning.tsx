import { type ReactNode, useState } from 'react'
import { useT } from '../i18n/context'
import { ActionButton } from '../ui/ActionButton'
import { Stamp } from '../ui/Stamp'

export const WARNING_KEY = 'phobos.warning'

function alreadyAccepted() {
  try {
    return window.localStorage.getItem(WARNING_KEY) === 'accepted'
  } catch {
    return false
  }
}

function rememberAcceptance() {
  try {
    window.localStorage.setItem(WARNING_KEY, 'accepted')
  } catch {
    // Without storage, the warning simply shows again next time.
  }
}

/** Shown once, before the first case file is opened. */
export function EntryWarning({ children }: { children: ReactNode }) {
  const t = useT()
  const [accepted, setAccepted] = useState(alreadyAccepted)

  if (accepted) return <>{children}</>

  const accept = () => {
    rememberAcceptance()
    setAccepted(true)
  }

  return (
    <section
      aria-labelledby="warning-title"
      className="mx-auto flex max-w-2xl flex-col items-start gap-6 border border-ash bg-ink-2 p-6 sm:p-10"
    >
      <Stamp tone="alarm">{t.warning.stamp}</Stamp>
      <h2 id="warning-title" className="font-display text-4xl font-black uppercase sm:text-5xl">
        {t.warning.title}
      </h2>
      <ul className="flex flex-col gap-3 font-serif text-lg text-bone/80">
        {t.warning.points.map((point) => (
          <li key={point}>— {point}</li>
        ))}
      </ul>
      <ActionButton variant="primary" onClick={accept}>
        {t.warning.accept}
      </ActionButton>
    </section>
  )
}
