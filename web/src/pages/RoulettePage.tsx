import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { drawPhobia, phobiaQuery } from '../api/client'
import { sessionStore } from '../browserStorage'
import { CaseFileJourney } from '../exposure/CaseFileJourney'
import { useLang, useT } from '../i18n/context'
import { facedSlugs } from '../logbook/logbook'
import { useLogbook } from '../logbook/store'
import { FearProfilePanel } from '../roulette/FearProfilePanel'
import { parseRouletteSearch, type Round, spin, toRouletteSearch } from '../roulette/round'
import { ActionButton } from '../ui/ActionButton'
import { caseLabel } from '../ui/caseLabel'
import { pageTitle, useDocumentTitle } from '../ui/documentTitle'
import { LoadFailure } from '../ui/LoadState'
import { Stamp } from '../ui/Stamp'

/** Infinite roulette: case files drawn one after another, without repetition until the deck is exhausted. */
export function RoulettePage() {
  const lang = useLang()
  const t = useT()
  useDocumentTitle(pageTitle(t.nav.roulette))
  const { skipFaced } = parseRouletteSearch(useSearch({ from: '/$lang/roulette' }))
  const navigate = useNavigate({ from: '/$lang/roulette' })
  const logbook = useLogbook()
  const queryClient = useQueryClient()

  // Each draw keeps the options it was asked with: changing them mid-journey only affects the next draw.
  const [request, setRequest] = useState(() => ({ number: 0, skipFaced }))

  // The draw does not depend on the language: switching language translates the case file drawn.
  const draw = useQuery({
    queryKey: ['roulette', request.number],
    queryFn: async () => {
      const exclude = request.skipFaced ? facedSlugs(logbook) : []
      const { phobia, round } = await spin(sessionStore(), (seen) => drawPhobia(lang, seen, exclude))
      if (phobia) queryClient.setQueryData(phobiaQuery(lang, phobia.slug).queryKey, phobia)
      return { slug: phobia?.slug ?? null, round }
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    retry: 1,
  })
  const slug = draw.data?.slug
  const shown = useQuery({
    ...phobiaQuery(lang, slug ?? ''),
    enabled: Boolean(slug),
    placeholderData: keepPreviousData,
  })
  const phobia = slug ? shown.data : undefined

  const drawAgain = (withSkipFaced = skipFaced) => {
    setRequest(({ number }) => ({ number: number + 1, skipFaced: withSkipFaced }))
    window.scrollTo({ top: 0 })
  }
  const setSkipFaced = (value: boolean) =>
    navigate({ search: toRouletteSearch({ skipFaced: value }), replace: true })

  return (
    <div className="pb-16">
      <RouletteBar
        round={phobia ? draw.data?.round : undefined}
        skipFaced={skipFaced}
        onSkipFacedChange={setSkipFaced}
        onSkip={phobia ? () => drawAgain() : undefined}
      />

      <AnimatePresence mode="wait">
        {phobia ? (
          <motion.div
            key={request.number}
            initial={{ opacity: 0, y: 40, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -24, rotate: 1 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <CaseFileJourney
              phobia={phobia}
              next={
                <ActionButton variant="primary" onClick={() => drawAgain()}>
                  {t.roulette.drawNext} <span aria-hidden="true">→</span>
                </ActionButton>
              }
            />
          </motion.div>
        ) : (
          <motion.div key="waiting" exit={{ opacity: 0 }} className="mx-auto max-w-6xl px-4 py-10">
            {(draw.isPending || shown.isLoading) && <Drum />}
            {(draw.isError || shown.isError || shown.data === null) && (
              <LoadFailure onRetry={() => drawAgain()} />
            )}
            {draw.data?.slug === null && (
              <NothingLeft
                skipFaced={request.skipFaced}
                onDrawEverything={() => {
                  setSkipFaced(false)
                  drawAgain(false)
                }}
                onRetry={() => drawAgain()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-4">
        <FearProfilePanel />
      </div>
    </div>
  )
}

function RouletteBar({
  round,
  skipFaced,
  onSkipFacedChange,
  onSkip,
}: {
  round: Round | undefined
  skipFaced: boolean
  onSkipFacedChange: (value: boolean) => void
  onSkip: (() => void) | undefined
}) {
  const t = useT()
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 border-b border-ash px-4 pt-8 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="label-mono text-rust-bright" aria-live="polite">
        {t.roulette.label}
        {round && (
          <span className="text-clinical">
            {' · '}
            {t.roulette.round(round.number, round.seen.length)}
          </span>
        )}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <label className="flex cursor-pointer items-center gap-3 font-serif text-bone/80">
          <input
            type="checkbox"
            checked={skipFaced}
            onChange={(event) => onSkipFacedChange(event.target.checked)}
            className="size-4 accent-rust-bright"
          />
          {t.roulette.skipFaced}
        </label>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="self-start label-mono text-clinical hover:text-bone"
          >
            {t.roulette.skip}
          </button>
        )}
      </div>
    </div>
  )
}

/** Case numbers rolling while the draw is on its way. Still when the visitor prefers less motion. */
function Drum() {
  const t = useT()
  const reducedMotion = useReducedMotion()
  const [number, setNumber] = useState(1)

  useEffect(() => {
    if (reducedMotion) return
    const timer = window.setInterval(() => setNumber((current) => ((current * 7 + 11) % 30) + 1), 70)
    return () => window.clearInterval(timer)
  }, [reducedMotion])

  return (
    <div role="status" className="flex flex-col items-start gap-3 py-16">
      <span className="font-display text-7xl font-black text-bone/90 tabular-nums" aria-hidden="true">
        {reducedMotion ? 'N°???' : caseLabel(number)}
      </span>
      <span className="label-mono text-clinical">{t.roulette.spinning}</span>
    </div>
  )
}

function NothingLeft({
  skipFaced,
  onDrawEverything,
  onRetry,
}: {
  skipFaced: boolean
  onDrawEverything: () => void
  onRetry: () => void
}) {
  const t = useT()
  if (!skipFaced) return <LoadFailure onRetry={onRetry} />

  return (
    <div className="flex flex-col items-start gap-6 py-10">
      <Stamp tone="sickly" className="text-5xl">
        {t.roulette.allFacedStamp}
      </Stamp>
      <p className="max-w-lg font-serif text-lg text-bone/80">{t.roulette.allFaced}</p>
      <ActionButton variant="primary" onClick={onDrawEverything}>
        {t.roulette.drawEverything}
      </ActionButton>
    </div>
  )
}
