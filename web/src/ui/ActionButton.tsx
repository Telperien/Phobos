import type { ButtonHTMLAttributes } from 'react'

const VARIANTS = {
  /** Avancer : « Niveau suivant » */
  primary: 'border-bone bg-bone text-ink hover:bg-transparent hover:text-bone',
  /** Sortie rassurante : « Je ne suis pas phobique » */
  safe: 'border-sickly text-sickly hover:bg-sickly hover:text-ink',
  /** Sortie d'urgence : « Pitié, on arrête ici » */
  escape: 'border-rust-bright text-rust-bright hover:bg-rust hover:text-bone hover:border-rust',
  /** Neutre */
  ghost: 'border-bone/40 text-bone hover:border-bone',
} as const

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS
}

export const actionClasses = (variant: keyof typeof VARIANTS = 'ghost') =>
  `inline-flex items-center justify-center gap-3 border px-5 py-3 font-display text-lg font-bold uppercase tracking-wide transition-colors duration-150 ${VARIANTS[variant]}`

export function ActionButton({ variant, className = '', type = 'button', ...props }: ActionButtonProps) {
  return <button type={type} className={`${actionClasses(variant)} ${className}`} {...props} />
}
