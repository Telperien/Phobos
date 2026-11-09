import type { ReactNode } from 'react'
import { ActionButton } from './ActionButton'

export function LoadingLine({ children }: { children: ReactNode }) {
  return (
    <p className="animate-pulse py-16 label-mono text-clinical" role="status">
      {children}
    </p>
  )
}

export function LoadFailure({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 py-16" role="alert">
      <p className="font-serif text-lg text-bone/80">
        Les archives ne répondent pas. Quelqu’un a dû couper le courant.
      </p>
      <ActionButton variant="ghost" onClick={onRetry}>
        Réessayer
      </ActionButton>
    </div>
  )
}
