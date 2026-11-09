import type { ReactNode } from 'react'

const TONES = {
  /** Sur papier */
  rust: 'border-rust text-rust',
  /** Sur fond sombre */
  alarm: 'border-rust-bright text-rust-bright',
  ink: 'border-ink/80 text-ink/80',
  sickly: 'border-sickly text-sickly',
  bone: 'border-bone/80 text-bone/80',
} as const

interface StampProps {
  children: ReactNode
  tone?: keyof typeof TONES
  className?: string
}

/** Tampon encreur : double bordure, légère rotation, encre un peu passée. */
export function Stamp({ children, tone = 'rust', className = '' }: StampProps) {
  return (
    <span
      className={`inline-block -rotate-6 border-4 border-double px-3 py-1 font-display text-xl font-extrabold uppercase leading-none tracking-wider opacity-85 ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
