import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { catalogueQuery } from '../api/client'
import { CaseFileGrid } from '../catalogue/CaseFileGrid'
import { EXPOSURE_LEVELS } from '../exposure/levels'
import { useLang, useT } from '../i18n/context'
import { actionClasses } from '../ui/ActionButton'
import { Stamp } from '../ui/Stamp'

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] as const },
})

export function HomePage() {
  return (
    <>
      <Hero />
      <Protocol />
      <Archives />
      <RouletteBand />
    </>
  )
}

function Hero() {
  const lang = useLang()
  const t = useT()
  const { title, card } = t.home

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-16 pb-20 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:pt-24">
      <div className="flex flex-col gap-7">
        <motion.p {...rise(0)} className="label-mono text-clinical">
          {t.home.kicker}
        </motion.p>
        <motion.h1
          {...rise(0.1)}
          className="font-display text-[clamp(4.5rem,14vw,10rem)] leading-[0.82] font-black tracking-tight uppercase"
        >
          {title.line1}
          <br />
          {title.before}
          <span className="text-rust-bright">{title.accent}</span>
          {title.after}
        </motion.h1>
        <motion.p {...rise(0.25)} className="max-w-lg font-serif text-xl leading-relaxed text-bone/80">
          {t.home.intro}
        </motion.p>
        <motion.div {...rise(0.4)} className="flex flex-wrap gap-3">
          <Link to="/$lang/dossiers" params={{ lang }} className={actionClasses('primary')}>
            {t.home.openArchives}
          </Link>
          <Link to="/$lang/roulette" params={{ lang }} className={actionClasses('ghost')}>
            {t.home.tryRoulette}
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, rotate: -8, y: 40 }}
        animate={{ opacity: 1, rotate: -3, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative mx-auto hidden w-full max-w-sm lg:block"
        aria-hidden="true"
      >
        <div className="paper absolute inset-0 translate-x-5 translate-y-4 rotate-6" />
        <div className="paper absolute inset-0 translate-x-2 translate-y-2 rotate-3" />
        <div className="paper relative flex aspect-[3/4] flex-col gap-4 p-7">
          <div className="flex justify-between border-b border-ink/30 pb-2 label-mono text-ink/60">
            <span>{card.file}</span>
            <span>{card.patient}</span>
          </div>
          <p className="font-display text-5xl leading-[0.9] font-black uppercase text-ink/85">
            {card.phobia}
            <br />
            {card.toBeDetermined}
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            {card.lines.map((line) => (
              <div key={line} className="flex items-end gap-3 font-mono text-xs text-ink/60">
                <span className="w-24 shrink-0">{line}</span>
                <span className="flex-1 border-b border-dotted border-ink/40" />
              </div>
            ))}
          </div>
          <Stamp tone="rust" className="mt-auto self-end text-3xl">
            {card.stamp}
          </Stamp>
        </div>
      </motion.div>
    </section>
  )
}

function Protocol() {
  const t = useT()
  const { protocol } = t.home

  return (
    <section className="border-y border-ash bg-ink-2">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-5xl font-black uppercase">{protocol.title}</h2>
          <p className="label-mono text-clinical">{protocol.subtitle}</p>
        </div>
        <ol className="grid gap-px bg-ash sm:grid-cols-2 lg:grid-cols-5">
          {EXPOSURE_LEVELS.map((level) => (
            <li key={level} className="flex flex-col gap-3 bg-ink-2 p-6 sm:pr-10">
              <span className="font-mono text-sm text-rust-bright">0{level}</span>
              <h3 className="font-display text-3xl font-extrabold break-words uppercase">
                {t.levels[level].name}
              </h3>
              <p className="font-serif text-bone/70">{t.levels[level].hint}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-2xl font-serif text-bone/70">
          {protocol.exitsBefore}
          <q className="text-sickly">{t.journey.notPhobic}</q>
          {protocol.or}
          <q className="text-rust-bright">{t.journey.stop}</q>
          {protocol.exitsAfter}
        </p>
      </div>
    </section>
  )
}

function Archives() {
  const lang = useLang()
  const t = useT()
  const catalogue = useQuery(catalogueQuery(lang))
  const firstFiles = (catalogue.data ?? []).slice(0, 6)

  return (
    <section id="dossiers" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-5xl font-black uppercase">{t.home.archives.title}</h2>
        <Link to="/$lang/dossiers" params={{ lang }} className="label-mono text-clinical hover:text-bone">
          {t.home.archives.seeAll(catalogue.data?.length ?? 30)}
        </Link>
      </div>
      <CaseFileGrid phobias={firstFiles} />
    </section>
  )
}

function RouletteBand() {
  const lang = useLang()
  const { rouletteBand } = useT().home

  return (
    <section className="overflow-hidden border-t border-ash bg-rust">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 lg:flex-row lg:items-center lg:justify-between">
        <p className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.9] font-black uppercase">
          {rouletteBand.line1}
          <br />
          <span className="text-ink">{rouletteBand.line2}</span>
          <br />
          <span className="text-ink/60">{rouletteBand.line2}</span>
        </p>
        <Link
          to="/$lang/roulette"
          params={{ lang }}
          className={`${actionClasses('primary')} self-start lg:self-auto`}
        >
          {rouletteBand.cta}
        </Link>
      </div>
    </section>
  )
}
