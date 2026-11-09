import { Link } from '@tanstack/react-router'
import type { PhobiaSummary } from '../api/client'
import { isFaced, type LogEntry } from '../logbook/logbook'
import { caseLabel } from '../ui/caseLabel'
import { Stamp } from '../ui/Stamp'
import { categoryLabel } from './categories'

const TILTS = ['-rotate-[0.8deg]', 'rotate-[0.5deg]', '-rotate-[0.3deg]', 'rotate-[0.9deg]']

interface CaseFileCardProps {
  phobia: PhobiaSummary
  index: number
  entry: LogEntry | undefined
}

export function CaseFileCard({ phobia, index, entry }: CaseFileCardProps) {
  const faced = isFaced(entry)

  return (
    <Link
      to="/dossiers/$slug"
      params={{ slug: phobia.slug }}
      aria-label={`Dossier ${caseLabel(phobia.caseNumber)}, ${phobia.name}${faced ? ' — affronté' : ''}`}
      className={`group relative block pt-6 transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-0 ${
        TILTS[index % TILTS.length]
      }`}
    >
      {/* Onglet de chemise cartonnée */}
      <span className="absolute top-0 left-0 bg-paper-dark px-4 pt-1.5 pb-2 font-mono text-xs font-semibold tracking-widest text-ink [clip-path:polygon(0_0,88%_0,100%_100%,0_100%)]">
        {caseLabel(phobia.caseNumber)}
      </span>

      <article className="paper relative flex min-h-64 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/25 pb-2">
          <span className="label-mono text-ink/60">{categoryLabel(phobia.category)}</span>
          <span className="label-mono text-ink/40">Exposition 3 niv.</span>
        </div>

        <h3 className="font-display text-4xl leading-[0.9] font-extrabold uppercase group-hover:animate-flicker">
          {phobia.name}
        </h3>
        <p className="font-serif text-sm italic text-ink/70">{phobia.etymology}</p>
        <p className="font-serif text-base leading-snug text-ink/85">{phobia.summary}</p>

        <p className="mt-auto pt-2 label-mono text-ink/55">
          {entry ? `Niveau atteint : ${entry.reachedLevel} / 3` : 'Jamais ouvert'}
        </p>

        {faced && (
          <Stamp tone="rust" className="absolute right-4 bottom-4">
            Affronté
          </Stamp>
        )}
      </article>
    </Link>
  )
}
