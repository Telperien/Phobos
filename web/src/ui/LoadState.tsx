import type { ReactNode } from 'react'
import { useT } from '../i18n/context'
import { ActionButton } from './ActionButton'

export function LoadingLine({ children }: { children: ReactNode }) {
  return (
    <p className="animate-pulse py-16 label-mono text-clinical" role="status">
      {children}
    </p>
  )
}

export function LoadFailure({ onRetry }: { onRetry: () => void }) {
  const t = useT()
  return (
    <div className="flex flex-col items-start gap-4 py-16" role="alert">
      <p className="font-serif text-lg text-bone/80">{t.load.failure}</p>
      <ActionButton variant="ghost" onClick={onRetry}>
        {t.load.retry}
      </ActionButton>
    </div>
  )
}
