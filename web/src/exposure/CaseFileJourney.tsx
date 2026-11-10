import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useReducer } from 'react'
import type { MediaView, PhobiaDetail } from '../api/client'
import { categoryName } from '../catalogue/categories'
import { useLang, useT } from '../i18n/context'
import { isFaced, type LogEntry } from '../logbook/logbook'
import { saveExit, saveProgress, useLogbook } from '../logbook/store'
import { ImageCredit } from '../media/ImageCredit'
import { MediaPlaceholder } from '../media/MediaPlaceholder'
import { YouTubeFacade } from '../media/YouTubeFacade'
import { ShareVerdictButton } from '../share/ShareVerdictButton'
import { ActionButton, actionClasses } from '../ui/ActionButton'
import { caseLabel } from '../ui/caseLabel'
import { Stamp } from '../ui/Stamp'
import { EntryWarning } from './EntryWarning'
import { FearGauge } from './FearGauge'
import { journeyReducer, START } from './journey'
import { FINAL_LEVEL, type LevelNumber } from './levels'
import { type ExitChoice, verdictFor } from './verdict'

/** Compact buttons in the sticky action bar, so three fit side by side in the journey column. */
const BAR_BUTTON = 'px-3 py-2.5 text-base leading-tight'

/**
 * A case file and its exposure journey: levels 1 to 5, then the verdict.
 * `next` is the main way forward offered with the verdict (next case file, next draw…).
 */
export function CaseFileJourney({ phobia, next: nextAction }: { phobia: PhobiaDetail; next: ReactNode }) {
  const t = useT()
  const [journey, dispatch] = useReducer(journeyReducer, START)
  const entry = useLogbook()[phobia.slug]
  const { level, outcome } = journey

  const next = () => {
    dispatch({ type: 'next' })
    saveProgress(phobia.slug, Math.min(level + 1, FINAL_LEVEL) as LevelNumber)
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
                next={nextAction}
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
                {/* Always within reach, however many images the level shows. */}
                <div className="sticky bottom-0 z-20 -mx-4 grid grid-cols-2 gap-2 border-t border-ash bg-ink/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none sm:px-0">
                  {level < FINAL_LEVEL && (
                    <ActionButton
                      variant="primary"
                      onClick={next}
                      className={`col-span-2 sm:col-span-1 ${BAR_BUTTON}`}
                    >
                      {t.journey.next} <span aria-hidden="true">→</span>
                    </ActionButton>
                  )}
                  <ActionButton variant="safe" onClick={() => exit('notPhobic')} className={BAR_BUTTON}>
                    {t.journey.notPhobic}
                  </ActionButton>
                  <ActionButton variant="escape" onClick={() => exit('stop')} className={BAR_BUTTON}>
                    {t.journey.stop}
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
  const lang = useLang()
  const t = useT()

  return (
    <aside className="relative self-start pt-6 lg:sticky lg:top-24">
      <Link
        to="/$lang/dossiers"
        params={{ lang }}
        className="absolute -top-4 left-0 label-mono text-clinical hover:text-bone"
      >
        {t.caseFile.back}
      </Link>
      <span className="absolute top-2 left-0 bg-paper-dark px-4 pt-1.5 pb-2 font-mono text-xs font-semibold tracking-widest text-ink [clip-path:polygon(0_0,88%_0,100%_100%,0_100%)]">
        {t.caseFile.file(caseLabel(phobia.caseNumber))}
      </span>
      <article className="paper relative mt-4 flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex justify-between border-b border-ink/25 pb-2 label-mono text-ink/60">
          <span>{categoryName(t.categories, phobia.category)}</span>
          <span>{t.caseFile.reference(phobia.caseNumber)}</span>
        </div>
        <h1 className="font-display text-[clamp(2.1rem,8.5vw,4.5rem)] leading-[0.85] font-black break-words uppercase">
          {phobia.name}
        </h1>
        <p className="font-serif italic text-ink/70">{phobia.etymology}</p>
        <p className="font-serif text-lg leading-relaxed text-ink/90">{phobia.description}</p>
        <p className="-rotate-1 border-l-2 border-rust pl-3 font-serif text-base italic text-rust">
          {t.caseFile.note(phobia.annotation)}
        </p>
        <div className="flex items-end justify-between gap-4 border-t border-ink/25 pt-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs text-ink/70">
            <div>
              <dt className="text-ink/45">{t.caseFile.reachedLevel}</dt>
              <dd className="text-sm text-rust">{entry ? `${entry.reachedLevel} / ${FINAL_LEVEL}` : '—'}</dd>
            </div>
            <div>
              <dt className="text-ink/45">{t.caseFile.status}</dt>
              <dd className="text-sm">{entry ? t.caseFile.underObservation : t.caseFile.neverExposed}</dd>
            </div>
          </dl>
          {isFaced(entry) && (
            <Stamp tone="rust" className="shrink-0">
              {t.caseFile.faced}
            </Stamp>
          )}
        </div>
      </article>
    </aside>
  )
}

function LevelHeader({ level }: { level: LevelNumber }) {
  const t = useT()
  const { name, hint } = t.levels[level]
  return (
    <header className="flex flex-col gap-1">
      <p className="flex items-baseline gap-3">
        <span className="sr-only">{t.journey.levelOf(level, FINAL_LEVEL)}</span>
        <span aria-hidden="true" className="label-mono text-clinical">
          {t.journey.level}
        </span>
        <span aria-hidden="true" className="font-display text-7xl leading-none font-black text-rust-bright">
          {level}
        </span>
        <span aria-hidden="true" className="font-display text-4xl leading-none font-black text-clinical">
          / {FINAL_LEVEL}
        </span>
      </p>
      <h2 id="exposure-title" className="font-display text-5xl font-black break-words uppercase">
        {name}
      </h2>
      <p className="font-serif text-bone/70">{hint}</p>
    </header>
  )
}

function LevelMedia({ level, phobia }: { level: LevelNumber; phobia: PhobiaDetail }) {
  const t = useT()
  const media = phobia.levels[level - 1]?.media ?? []

  if (level === FINAL_LEVEL) {
    const video = media.find((item) => item.kind === 'youtube')
    return video ? (
      <YouTubeFacade videoId={video.source} startSeconds={video.startSeconds} title={phobia.name} />
    ) : (
      <MediaPlaceholder plate="05-A" caption={t.journey.videoPending} />
    )
  }

  return <ImagePlates level={level} media={media} name={phobia.name} />
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
  const t = useT()
  if (media.length === 0) {
    return (
      <MediaPlaceholder
        plate={`0${level}-A`}
        caption={level === 1 ? t.journey.softPending : t.journey.harshPending}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {media.map((item, index) => (
        <figure key={item.source} className="flex flex-col gap-1">
          <img
            src={item.source}
            alt={t.journey.imageAlt(name, `0${level}-${String.fromCharCode(65 + index)}`)}
            className="aspect-[4/3] w-full border border-ash object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
          {item.credit && (
            <figcaption>
              <ImageCredit credit={item.credit} />
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}

function VerdictPanel({
  phobia,
  outcome,
  next,
  onRestart,
}: {
  phobia: PhobiaDetail
  outcome: { level: LevelNumber; choice: ExitChoice }
  next: ReactNode
  onRestart: () => void
}) {
  const lang = useLang()
  const t = useT()
  const verdict = verdictFor(outcome.level, outcome.choice)
  const text = t.verdict.kinds[verdict.kind]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      className="flex flex-col items-start gap-6 border border-ash bg-ink-2 p-6 sm:p-10"
    >
      <p className="label-mono text-clinical">{t.verdict.heading(phobia.name)}</p>
      <Stamp tone={verdict.tone === 'safe' ? 'sickly' : 'alarm'} className="text-5xl sm:text-6xl">
        {text.title}
      </Stamp>
      <p className="max-w-md font-serif text-lg text-bone/80">{text.detail(outcome.level)}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {next}
        <ShareVerdictButton phobia={phobia} outcome={outcome} />
        <ActionButton variant="ghost" onClick={onRestart}>
          {t.verdict.restart}
        </ActionButton>
        <Link to="/$lang/mon-dossier" params={{ lang }} className={actionClasses('ghost')}>
          {t.verdict.myFile}
        </Link>
      </div>
    </motion.div>
  )
}
