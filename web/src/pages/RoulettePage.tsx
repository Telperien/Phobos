import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { drawPhobia, LANG } from '../api/client'
import { CaseFileJourney } from '../exposure/CaseFileJourney'
import { facedSlugs } from '../logbook/logbook'
import { useLogbook } from '../logbook/store'
import { FearProfilePanel } from '../roulette/FearProfilePanel'
import { parseRouletteSearch, type Round, spin, tabStorage, toRouletteSearch } from '../roulette/round'
import { ActionButton } from '../ui/ActionButton'
import { caseLabel } from '../ui/caseLabel'
import { LoadFailure } from '../ui/LoadState'
import { Stamp } from '../ui/Stamp'

/** Infinite roulette: case files drawn one after another, without repetition until the deck is exhausted. */
export function RoulettePage() {
  const { skipFaced } = parseRouletteSearch(useSearch({ from: '/roulette' }))
  const navigate = useNavigate({ from: '/roulette' })
  const logbook = useLogbook()
  // Each draw keeps the options it was asked with: changing them mid-journey only affects the next draw.
  const [request, setRequest] = useState(() => ({ number: 0, skipFaced }))

  const draw = useQuery({
    queryKey: ['roulette', LANG, request.number],
    queryFn: () =>
      spin(tabStorage(), (seen) => drawPhobia(LANG, seen, request.skipFaced ? facedSlugs(logbook) : [])),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    retry: 1,
  })

  const drawAgain = (withSkipFaced = skipFaced) => {
    setRequest(({ number }) => ({ number: number + 1, skipFaced: withSkipFaced }))
    window.scrollTo({ top: 0 })
  }
  const setSkipFaced = (value: boolean) =>
    navigate({ search: toRouletteSearch({ skipFaced: value }), replace: true })

  return (
    <div className="pb-16">
      <RouletteBar
        round={draw.data?.phobia ? draw.data.round : undefined}
        skipFaced={skipFaced}
        onSkipFacedChange={setSkipFaced}
        onSkip={draw.data?.phobia ? () => drawAgain() : undefined}
      />

      <AnimatePresence mode="wait">
        {draw.data?.phobia ? (
          <motion.div
            key={request.number}
            initial={{ opacity: 0, y: 40, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -24, rotate: 1 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <CaseFileJourney
              phobia={draw.data.phobia}
              next={
                <ActionButton variant="primary" onClick={() => drawAgain()}>
                  Tirer la suivante <span aria-hidden="true">→</span>
                </ActionButton>
              }
            />
          </motion.div>
        ) : (
          <motion.div key="waiting" exit={{ opacity: 0 }} className="mx-auto max-w-6xl px-4 py-10">
            {draw.isPending && <Drum />}
            {draw.isError && <LoadFailure onRetry={() => draw.refetch()} />}
            {draw.data?.phobia === null && (
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
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 border-b border-ash px-4 pt-8 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="label-mono text-rust-bright" aria-live="polite">
        Roulette
        {round && (
          <span className="text-clinical">
            {' '}
            · Tour {round.number} · Tirage {round.seen.length}
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
          Seulement celles que je n’ai pas encore affrontées
        </label>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="self-start label-mono text-clinical hover:text-bone"
          >
            Passer ce dossier →
          </button>
        )}
      </div>
    </div>
  )
}

/** Case numbers rolling while the draw is on its way. Still when the visitor prefers less motion. */
function Drum() {
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
      <span className="label-mono text-clinical">La roulette tourne…</span>
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
  if (!skipFaced) return <LoadFailure onRetry={onRetry} />

  return (
    <div className="flex flex-col items-start gap-6 py-10">
      <Stamp tone="sickly" className="text-5xl">
        Tout affronté
      </Stamp>
      <p className="max-w-lg font-serif text-lg text-bone/80">
        Chaque dossier a été affronté jusqu’au niveau 3 : il n’en reste aucun à tenter.
      </p>
      <ActionButton variant="primary" onClick={onDrawEverything}>
        Tirer parmi tous les dossiers
      </ActionButton>
    </div>
  )
}
