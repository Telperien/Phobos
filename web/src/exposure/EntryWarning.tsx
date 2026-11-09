import { type ReactNode, useState } from 'react'
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
      <Stamp tone="alarm">Lire avant exposition</Stamp>
      <h2 id="warning-title" className="font-display text-4xl font-black uppercase sm:text-5xl">
        Avant d’ouvrir les dossiers
      </h2>
      <ul className="flex flex-col gap-3 font-serif text-lg text-bone/80">
        <li>— Phobos est un jeu, pas un diagnostic médical.</li>
        <li>
          — Les niveaux 2 et 3 montrent des images et des vidéos qui peuvent vraiment mettre mal à l’aise.
        </li>
        <li>— Tu peux t’arrêter à tout moment, sans rien à prouver.</li>
        <li>
          — Si une peur t’empêche de vivre normalement, parles-en à un médecin ou à un psychologue : les
          phobies se soignent très bien.
        </li>
      </ul>
      <ActionButton variant="primary" onClick={accept}>
        J’ai compris, ouvrir le dossier
      </ActionButton>
    </section>
  )
}
