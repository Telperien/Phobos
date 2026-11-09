import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { catalogueQuery, LANG, type PhobiaSummary } from '../api/client'
import { verdictFor } from '../exposure/verdict'
import { isFaced, type LogEntry } from '../logbook/logbook'
import { forgetEverything, useLogbook } from '../logbook/store'
import { ActionButton, actionClasses } from '../ui/ActionButton'
import { caseLabel } from '../ui/caseLabel'
import { LoadFailure, LoadingLine } from '../ui/LoadState'
import { Stamp } from '../ui/Stamp'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function MyFilePage() {
  const logbook = useLogbook()
  const catalogue = useQuery(catalogueQuery(LANG))

  const opened = (catalogue.data ?? [])
    .filter((phobia) => logbook[phobia.slug])
    .map((phobia) => ({ phobia, entry: logbook[phobia.slug] as LogEntry }))
    .sort(
      (a, b) =>
        Number(isFaced(b.entry)) - Number(isFaced(a.entry)) ||
        b.entry.updatedAt.localeCompare(a.entry.updatedAt),
    )
  const faced = opened.filter(({ entry }) => isFaced(entry)).length

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-10 flex flex-col gap-3">
        <p className="label-mono text-clinical">Dossier patient — conservé dans ce navigateur uniquement</p>
        <h1 className="font-display text-6xl font-black uppercase sm:text-7xl">Mon dossier</h1>
        <p className="font-serif text-lg text-bone/70">
          {faced} phobie{faced > 1 ? 's' : ''} affrontée{faced > 1 ? 's' : ''} jusqu’au niveau 3, sur{' '}
          {opened.length} dossier{opened.length > 1 ? 's' : ''} ouvert{opened.length > 1 ? 's' : ''}.
        </p>
      </header>

      {catalogue.isPending && <LoadingLine>Lecture du dossier…</LoadingLine>}
      {catalogue.isError && <LoadFailure onRetry={() => catalogue.refetch()} />}
      {catalogue.isSuccess && opened.length === 0 && <EmptyFile />}

      {opened.length > 0 && (
        <>
          <ol className="flex flex-col border-t border-ash">
            {opened.map(({ phobia, entry }) => (
              <FileLine key={phobia.slug} phobia={phobia} entry={entry} />
            ))}
          </ol>
          <ForgetButton />
        </>
      )}
    </div>
  )
}

function FileLine({ phobia, entry }: { phobia: PhobiaSummary; entry: LogEntry }) {
  const verdict = entry.lastExit ? verdictFor(entry.lastExit.level, entry.lastExit.choice) : null

  return (
    <li className="border-b border-ash">
      <Link
        to="/dossiers/$slug"
        params={{ slug: phobia.slug }}
        className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2 py-5 transition-colors hover:bg-ink-2 sm:grid-cols-[auto_1fr_auto_auto]"
      >
        <span className="font-mono text-xs text-clinical">{caseLabel(phobia.caseNumber)}</span>
        <span className="font-display text-3xl font-extrabold uppercase">{phobia.name}</span>
        <span className="col-start-2 label-mono text-clinical sm:col-start-auto">
          Niveau {entry.reachedLevel} / 3 · {dateFormat.format(new Date(entry.updatedAt))}
        </span>
        <span className="col-start-2 sm:col-start-auto">
          {isFaced(entry) ? (
            <Stamp tone="alarm" className="text-base">
              Affronté
            </Stamp>
          ) : (
            <span className={`label-mono ${verdict?.tone === 'safe' ? 'text-sickly' : 'text-bone/60'}`}>
              {verdict?.title ?? 'En cours'}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}

function EmptyFile() {
  return (
    <div className="flex flex-col items-start gap-6 border border-ash bg-ink-2 p-8">
      <p className="font-serif text-lg text-bone/80">
        Dossier vierge. Aucune exposition enregistrée pour l’instant.
      </p>
      <Link to="/dossiers" className={actionClasses('primary')}>
        Ouvrir les archives
      </Link>
    </div>
  )
}

function ForgetButton() {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <ActionButton variant="ghost" className="mt-10" onClick={() => setConfirming(true)}>
        Effacer mon dossier
      </ActionButton>
    )
  }

  return (
    <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <p className="font-serif text-bone/80">
        Tout effacer de ce navigateur ? Impossible de revenir en arrière.
      </p>
      <ActionButton variant="escape" onClick={forgetEverything}>
        Oui, tout effacer
      </ActionButton>
      <ActionButton variant="ghost" onClick={() => setConfirming(false)}>
        Annuler
      </ActionButton>
    </div>
  )
}
