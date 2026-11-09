import { Link, useParams } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { FearGauge } from '../exposure/FearGauge'
import { HoldToReveal } from '../exposure/HoldToReveal'
import { EXPOSURE_LEVELS, type LevelNumber } from '../exposure/levels'
import { type ExitChoice, type Verdict, verdictFor } from '../exposure/verdict'
import { MediaPlaceholder } from '../media/MediaPlaceholder'
import { VideoFacade } from '../media/VideoFacade'
import { caseLabel, findMockPhobia, MOCK_PHOBIAS, type MockPhobia } from '../mock/phobias'
import { ActionButton, actionClasses } from '../ui/ActionButton'
import { Stamp } from '../ui/Stamp'

export function PhobiaPage() {
  const { slug } = useParams({ from: '/dossiers/$slug' })
  const phobia = findMockPhobia(slug)

  if (!phobia) return <MissingFile />
  return <CaseFile key={slug} phobia={phobia} />
}

function CaseFile({ phobia }: { phobia: MockPhobia }) {
  const [level, setLevel] = useState<LevelNumber>(1)
  const [verdict, setVerdict] = useState<Verdict | null>(null)

  const exit = (choice: ExitChoice) => setVerdict(verdictFor(level, choice))
  const restart = () => {
    setLevel(1)
    setVerdict(null)
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[0.85fr_1.4fr] lg:gap-14 lg:py-14">
      <Dossier phobia={phobia} />

      <section className="flex flex-col gap-6" aria-labelledby="exposure-title">
        <FearGauge level={level} />
        <AnimatePresence mode="wait">
          {verdict ? (
            <VerdictPanel key="verdict" verdict={verdict} phobia={phobia} onRestart={restart} />
          ) : (
            <motion.div
              key={level}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-6"
            >
              <LevelHeader level={level} />
              <LevelMedia level={level} phobia={phobia} />
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {level < 3 && (
                  <ActionButton variant="primary" onClick={() => setLevel((level + 1) as LevelNumber)}>
                    Niveau suivant <span aria-hidden="true">→</span>
                  </ActionButton>
                )}
                <ActionButton variant="safe" onClick={() => exit('notPhobic')}>
                  Je ne suis pas phobique
                </ActionButton>
                <ActionButton variant="escape" onClick={() => exit('stop')}>
                  Pitié, on arrête ici
                </ActionButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}

function Dossier({ phobia }: { phobia: MockPhobia }) {
  return (
    <aside className="relative self-start pt-6 lg:sticky lg:top-24">
      <Link
        to="/"
        hash="dossiers"
        className="absolute -top-4 left-0 label-mono text-clinical hover:text-bone"
      >
        ← Archives
      </Link>
      <span className="absolute top-2 left-0 bg-paper-dark px-4 pt-1.5 pb-2 font-mono text-xs font-semibold tracking-widest text-ink [clip-path:polygon(0_0,88%_0,100%_100%,0_100%)]">
        Dossier {caseLabel(phobia.caseNumber)}
      </span>
      <article className="paper relative mt-4 flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex justify-between border-b border-ink/25 pb-2 label-mono text-ink/60">
          <span>{phobia.category}</span>
          <span>Réf. PHB-{phobia.caseNumber}</span>
        </div>
        <h1 className="font-display text-[clamp(3rem,8vw,4.5rem)] leading-[0.85] font-black uppercase">
          {phobia.name}
        </h1>
        <p className="font-serif italic text-ink/70">{phobia.scientificName}</p>
        <p className="font-serif text-lg leading-relaxed text-ink/90">{phobia.description}</p>
        <p className="-rotate-1 border-l-2 border-rust pl-3 font-serif text-base italic text-rust">
          Note : {phobia.annotation}
        </p>
        <div className="flex items-end justify-between gap-4 border-t border-ink/25 pt-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs text-ink/70">
            <div>
              <dt className="text-ink/45">Abandon niv. 2</dt>
              <dd className="text-sm text-rust">{phobia.stopRateAtLevel2} %</dd>
            </div>
            <div>
              <dt className="text-ink/45">Statut</dt>
              <dd className="text-sm">En observation</dd>
            </div>
          </dl>
          <Stamp tone="rust" className="shrink-0">
            Examiné
          </Stamp>
        </div>
      </article>
    </aside>
  )
}

function LevelHeader({ level }: { level: LevelNumber }) {
  const { name, hint } = EXPOSURE_LEVELS[level - 1]
  return (
    <header className="flex flex-col gap-1">
      <p className="label-mono text-rust-bright">Niveau 0{level} / 03</p>
      <h2 id="exposure-title" className="font-display text-5xl font-black uppercase">
        {name}
      </h2>
      <p className="font-serif text-bone/70">{hint}</p>
    </header>
  )
}

function LevelMedia({ level, phobia }: { level: LevelNumber; phobia: MockPhobia }) {
  if (level === 1) {
    return (
      <MediaPlaceholder plate="01-A" caption={`Version douce, presque attendrissante. ${phobia.summary}`} />
    )
  }
  if (level === 2) {
    return (
      <HoldToReveal warning="Contenu sensible — niveau 02">
        <div className="grid gap-2 sm:grid-cols-2">
          <MediaPlaceholder plate="02-A" caption="Gros plan franc, éclairage cru." />
          <MediaPlaceholder plate="02-B" caption="Le pire angle possible." />
        </div>
      </HoldToReveal>
    )
  }
  return <VideoFacade title={phobia.name} />
}

function VerdictPanel({
  verdict,
  phobia,
  onRestart,
}: {
  verdict: Verdict
  phobia: MockPhobia
  onRestart: () => void
}) {
  const index = MOCK_PHOBIAS.indexOf(phobia)
  const next = MOCK_PHOBIAS[(index + 1) % MOCK_PHOBIAS.length]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      className="flex flex-col items-start gap-6 border border-ash bg-ink-2 p-6 sm:p-10"
    >
      <p className="label-mono text-clinical">Verdict — {phobia.name}</p>
      <Stamp tone={verdict.tone === 'safe' ? 'sickly' : 'alarm'} className="text-5xl sm:text-6xl">
        {verdict.title}
      </Stamp>
      <p className="max-w-md font-serif text-lg text-bone/80">{verdict.detail}</p>
      <p className="label-mono text-clinical">
        {phobia.stopRateAtLevel2} % des visiteurs ont craqué au niveau 2
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/dossiers/$slug" params={{ slug: next.slug }} className={actionClasses('primary')}>
          Dossier suivant <span aria-hidden="true">→</span>
        </Link>
        <ActionButton variant="ghost" onClick={onRestart}>
          Recommencer
        </ActionButton>
      </div>
    </motion.div>
  )
}

function MissingFile() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-24">
      <Stamp tone="bone" className="text-4xl">
        Dossier introuvable
      </Stamp>
      <p className="font-serif text-lg text-bone/70">
        Ce dossier n’existe pas, ou quelqu’un l’a fait disparaître.
      </p>
      <Link to="/" className={actionClasses('ghost')}>
        Retour aux archives
      </Link>
    </div>
  )
}
