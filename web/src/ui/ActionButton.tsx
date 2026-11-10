import type { ButtonHTMLAttributes } from 'react'

const VARIANTS = {
  /** Avancer : « Niveau suivant » */
  primary: 'border-bone bg-bone text-ink hover:border-paper hover:bg-paper',
  /** Sortie rassurante : « Je ne suis pas phobique » */
  safe: 'border-sickly bg-sickly text-ink hover:brightness-110',
  /** Sortie d'urgence : « Pitié, on arrête ici » */
  escape: 'border-rust bg-rust text-bone hover:border-rust-bright hover:bg-[#a3321f]',
  /** Neutre, actions secondaires */
  ghost: 'border-bone/40 text-bone hover:border-bone hover:bg-bone/10',
} as const

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS
}

export const actionClasses = (variant: keyof typeof VARIANTS = 'ghost') =>
  `inline-flex cursor-pointer items-center justify-center gap-3 border-2 px-5 py-3 text-center font-display text-lg font-bold uppercase tracking-wide transition duration-150 active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${VARIANTS[variant]}`

export function ActionButton({ variant, className = '', type = 'button', ...props }: ActionButtonProps) {
  return <button type={type} className={`${actionClasses(variant)} ${className}`} {...props} />
}
