import { Link } from '@tanstack/react-router'
import { caseLabel, type MockPhobia } from '../mock/phobias'

const TILTS = ['-rotate-[0.8deg]', 'rotate-[0.5deg]', '-rotate-[0.3deg]', 'rotate-[0.9deg]']

export function CaseFileCard({ phobia, index }: { phobia: MockPhobia; index: number }) {
  return (
    <Link
      to="/dossiers/$slug"
      params={{ slug: phobia.slug }}
      className={`group relative block pt-6 transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-0 ${
        TILTS[index % TILTS.length]
      }`}
    >
      {/* Onglet de chemise cartonnée */}
      <span className="absolute top-0 left-0 bg-paper-dark px-4 pt-1.5 pb-2 font-mono text-xs font-semibold tracking-widest text-ink [clip-path:polygon(0_0,88%_0,100%_100%,0_100%)]">
        {caseLabel(phobia.caseNumber)}
      </span>

      <article className="paper flex min-h-64 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/25 pb-2">
          <span className="label-mono text-ink/60">{phobia.category}</span>
          <span className="label-mono text-ink/40">Exposition 3 niv.</span>
        </div>

        <h3 className="font-display text-4xl leading-[0.9] font-extrabold uppercase group-hover:animate-flicker">
          {phobia.name}
        </h3>
        <p className="font-serif text-sm italic text-ink/70">{phobia.scientificName}</p>
        <p className="font-serif text-base leading-snug text-ink/85">{phobia.summary}</p>

        <div className="mt-auto flex flex-col gap-1.5 pt-2">
          <div className="flex justify-between label-mono text-ink/60">
            <span>Abandon au niveau 2</span>
            <span className="text-rust">{phobia.stopRateAtLevel2} %</span>
          </div>
          <div className="h-1 bg-ink/15">
            <div className="h-full bg-rust" style={{ width: `${phobia.stopRateAtLevel2}%` }} />
          </div>
        </div>
      </article>
    </Link>
  )
}
