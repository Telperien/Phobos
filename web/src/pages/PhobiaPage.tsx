import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useReducer } from 'react'
import { catalogueQuery, LANG, type MediaView, type PhobiaDetail, phobiaQuery } from '../api/client'
import { categoryLabel } from '../catalogue/categories'
import { EntryWarning } from '../exposure/EntryWarning'
import { FearGauge } from '../exposure/FearGauge'
import { HoldToReveal } from '../exposure/HoldToReveal'
import { journeyReducer, START } from '../exposure/journey'
import { EXPOSURE_LEVELS, type LevelNumber } from '../exposure/levels'
import { type ExitChoice, verdictFor } from '../exposure/verdict'
import { isFaced, type LogEntry } from '../logbook/logbook'
import { saveExit, saveProgress, useLogbook } from '../logbook/store'
import { MediaPlaceholder } from '../media/MediaPlaceholder'
import { YouTubeFacade } from '../media/YouTubeFacade'
import { ActionButton, actionClasses } from '../ui/ActionButton'
import { caseLabel } from '../ui/caseLabel'
import { LoadFailure, LoadingLine } from '../ui/LoadState'
import { Stamp } from '../ui/Stamp'

export function PhobiaPage() {
  const { slug } = useParams({ from: '/dossiers/$slug' })
  const phobia = useQuery(phobiaQuery(LANG, slug))

  if (phobia.isPending)
    return (
      <PageFrame>
        <LoadingLine>Ouverture du dossier…</LoadingLine>
      </PageFrame>
    )
  if (phobia.isError)
    return (
      <PageFrame>
        <LoadFailure onRetry={() => phobia.refetch()} />
      </PageFrame>
    )
  if (phobia.data === null) return <MissingFile />
  return <CaseFile key={slug} phobia={phobia.data} />
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
}

function CaseFile({ phobia }: { phobia: PhobiaDetail }) {
  const [journey, dispatch] = useReducer(journeyReducer, START)
  const entry = useLogbook()[phobia.slug]
  const { level, outcome } = journey

  const next = () => {
    dispatch({ type: 'next' })
    saveProgress(phobia.slug, Math.min(level + 1, 3) as LevelNumber)
  }
  const exit = (choice: ExitChoice) => {
    dispatch({ type: 'exit', choice })
    saveExit(phobia.slug, { level, choice })
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[0.85fr_1.4fr] lg:gap-14 lg:py-14">
      <Dossier phobia={phobia} entry={entry} />

      <EntryWarning>
        <JourneyStart slug={phobia.slug} />
        <section className="flex flex-col gap-6" aria-labelledby="exposure-title">
          <FearGauge level={level} />
          <AnimatePresence mode="wait">
            {outcome ? (
              <VerdictPanel
                key="verdict"
                phobia={phobia}
                outcome={outcome}
                onRestart={() => dispatch({ type: 'restart' })}
              />
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
                    <ActionButton variant="primary" onClick={next}>
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
      </EntryWarning>
    </div>
  )
}

/** Opening a case file (after the warning) counts as reaching level 1. */
function JourneyStart({ slug }: { slug: string }) {
  useEffect(() => saveProgress(slug, 1), [slug])
  return null
}

function Dossier({ phobia, entry }: { phobia: PhobiaDetail; entry: LogEntry | undefined }) {
  return (
    <aside className="relative self-start pt-6 lg:sticky lg:top-24">
      <Link to="/dossiers" className="absolute -top-4 left-0 label-mono text-clinical hover:text-bone">
        ← Archives
      </Link>
      <span className="absolute top-2 left-0 bg-paper-dark px-4 pt-1.5 pb-2 font-mono text-xs font-semibold tracking-widest text-ink [clip-path:polygon(0_0,88%_0,100%_100%,0_100%)]">
        Dossier {caseLabel(phobia.caseNumber)}
      </span>
      <article className="paper relative mt-4 flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex justify-between border-b border-ink/25 pb-2 label-mono text-ink/60">
          <span>{categoryLabel(phobia.category)}</span>
          <span>Réf. PHB-{phobia.caseNumber}</span>
        </div>
        <h1 className="font-display text-[clamp(2.1rem,8.5vw,4.5rem)] leading-[0.85] font-black break-words uppercase">
          {phobia.name}
        </h1>
        <p className="font-serif italic text-ink/70">{phobia.etymology}</p>
        <p className="font-serif text-lg leading-relaxed text-ink/90">{phobia.description}</p>
        <p className="-rotate-1 border-l-2 border-rust pl-3 font-serif text-base italic text-rust">
          Note : {phobia.annotation}
        </p>
        <div className="flex items-end justify-between gap-4 border-t border-ink/25 pt-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs text-ink/70">
            <div>
              <dt className="text-ink/45">Niveau atteint</dt>
              <dd className="text-sm text-rust">{entry ? `${entry.reachedLevel} / 3` : '—'}</dd>
            </div>
            <div>
              <dt className="text-ink/45">Statut</dt>
              <dd className="text-sm">{entry ? 'En observation' : 'Jamais exposé'}</dd>
            </div>
          </dl>
          {isFaced(entry) && (
            <Stamp tone="rust" className="shrink-0">
              Affronté
            </Stamp>
          )}
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

function LevelMedia({ level, phobia }: { level: LevelNumber; phobia: PhobiaDetail }) {
  const media = phobia.levels[level - 1]?.media ?? []

  if (level === 3) {
    const video = media.find((item) => item.kind === 'youtube')
    return video ? (
      <YouTubeFacade videoId={video.source} startSeconds={video.startSeconds} title={phobia.name} />
    ) : (
      <MediaPlaceholder plate="03-A" caption="Vidéo à venir. Le dossier est encore en cours d’instruction." />
    )
  }

  const images = <ImagePlates level={level} media={media} name={phobia.name} />
  return level === 1 ? images : <HoldToReveal warning="Contenu sensible — niveau 02">{images}</HoldToReveal>
}

function ImagePlates({
  level,
  media,
  name,
}: {
  level: LevelNumber
  media: readonly MediaView[]
  name: string
}) {
  if (media.length === 0) {
    return (
      <MediaPlaceholder
        plate={`0${level}-A`}
        caption={level === 1 ? 'Image douce à venir.' : 'Images franches à venir. Profite du répit.'}
      />
    )
  }

  return (
    <div className={`grid gap-2 ${media.length > 1 ? 'sm:grid-cols-2' : ''}`}>
      {media.map((item, index) => (
        <img
          key={item.source}
          src={item.source}
          alt={`${name}, planche 0${level}-${String.fromCharCode(65 + index)}`}
          className="aspect-[4/3] w-full border border-ash object-cover"
          draggable={false}
        />
      ))}
    </div>
  )
}

function VerdictPanel({
  phobia,
  outcome,
  onRestart,
}: {
  phobia: PhobiaDetail
  outcome: { level: LevelNumber; choice: ExitChoice }
  onRestart: () => void
}) {
  const verdict = verdictFor(outcome.level, outcome.choice)
  const catalogue = useQuery(catalogueQuery(LANG))
  const list = catalogue.data ?? []
  const next = list[(list.findIndex((item) => item.slug === phobia.slug) + 1) % Math.max(list.length, 1)]

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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {next && (
          <Link to="/dossiers/$slug" params={{ slug: next.slug }} className={actionClasses('primary')}>
            Dossier suivant <span aria-hidden="true">→</span>
          </Link>
        )}
        <ActionButton variant="ghost" onClick={onRestart}>
          Recommencer
        </ActionButton>
        <Link to="/mon-dossier" className={actionClasses('ghost')}>
          Mon dossier
        </Link>
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
      <Link to="/dossiers" className={actionClasses('ghost')}>
        Retour aux archives
      </Link>
    </div>
  )
}
