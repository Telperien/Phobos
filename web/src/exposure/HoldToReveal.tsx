import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react'

interface HoldToRevealProps {
  children: ReactNode
  durationMs?: number
  onReveal?: () => void
  warning?: string
}

const isHoldKey = (key: string) => key === ' ' || key === 'Enter'

export function HoldToReveal({
  children,
  durationMs = 1400,
  onReveal,
  warning = 'Contenu sensible',
}: HoldToRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const start = () => {
    if (timer.current !== undefined) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      timer.current = undefined
      setHolding(false)
      setRevealed(true)
      onReveal?.()
    }, durationMs)
  }

  const cancel = () => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    setHolding(false)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isHoldKey(event.key)) return
    event.preventDefault()
    start()
  }

  return (
    <div className="relative overflow-hidden bg-ink-2">
      <div
        data-testid="hold-to-reveal-media"
        data-revealed={revealed}
        className={`transition-[filter,transform] duration-700 ease-out ${
          revealed ? '' : 'scale-110 blur-2xl grayscale'
        }`}
      >
        {children}
      </div>

      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/40 p-4 text-center">
          <p className="label-mono text-rust-bright">{warning}</p>
          <button
            type="button"
            onPointerDown={start}
            onPointerUp={cancel}
            onPointerLeave={cancel}
            onPointerCancel={cancel}
            onKeyDown={onKeyDown}
            onKeyUp={(event) => isHoldKey(event.key) && cancel()}
            onContextMenu={(event) => event.preventDefault()}
            className={`relative touch-none select-none overflow-hidden border border-bone/70 px-6 py-4 label-mono text-bone transition-colors hover:border-bone ${
              holding ? 'animate-tremble' : ''
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 bg-rust ease-linear"
              style={{
                width: holding ? '100%' : '0%',
                transitionProperty: 'width',
                transitionDuration: holding ? `${durationMs}ms` : '200ms',
              }}
            />
            <span className="relative">Maintenir pour révéler</span>
          </button>
        </div>
      )}
    </div>
  )
}
