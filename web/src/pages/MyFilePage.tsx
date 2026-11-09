import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { catalogueQuery, type PhobiaSummary } from '../api/client'
import { verdictFor } from '../exposure/verdict'
import { useLang, useT } from '../i18n/context'
import { LOCALES } from '../i18n/languages'
import { isFaced, type LogEntry } from '../logbook/logbook'
import { forgetEverything, useLogbook } from '../logbook/store'
import { FearProfilePanel } from '../roulette/FearProfilePanel'
import { ActionButton, actionClasses } from '../ui/ActionButton'
import { caseLabel } from '../ui/caseLabel'
import { LoadFailure, LoadingLine } from '../ui/LoadState'
import { Stamp } from '../ui/Stamp'

export function MyFilePage() {
  const t = useT()
  const logbook = useLogbook()
  const catalogue = useQuery(catalogueQuery(useLang()))

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
        <p className="label-mono text-clinical">{t.myFile.kicker}</p>
        <h1 className="font-display text-6xl font-black break-words uppercase sm:text-7xl">
          {t.myFile.title}
        </h1>
        <p className="font-serif text-lg text-bone/70">{t.myFile.summary(faced, opened.length)}</p>
      </header>

      {catalogue.isPending && <LoadingLine>{t.myFile.loading}</LoadingLine>}
      {catalogue.isError && <LoadFailure onRetry={() => catalogue.refetch()} />}
      {catalogue.isSuccess && opened.length === 0 && <EmptyFile />}

      {opened.length > 0 && (
        <>
          <div className="mb-10">
            <FearProfilePanel />
          </div>
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
  const lang = useLang()
  const t = useT()
  const verdict = entry.lastExit ? verdictFor(entry.lastExit.level, entry.lastExit.choice) : null
  const date = new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'short' }).format(
    new Date(entry.updatedAt),
  )

  return (
    <li className="border-b border-ash">
      <Link
        to="/$lang/dossiers/$slug"
        params={{ lang, slug: phobia.slug }}
        className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2 py-5 transition-colors hover:bg-ink-2 sm:grid-cols-[auto_1fr_auto_auto]"
      >
        <span className="font-mono text-xs text-clinical">{caseLabel(phobia.caseNumber)}</span>
        <span className="font-display text-3xl font-extrabold uppercase">{phobia.name}</span>
        <span className="col-start-2 label-mono text-clinical sm:col-start-auto">
          {t.myFile.line(entry.reachedLevel, date)}
        </span>
        <span className="col-start-2 sm:col-start-auto">
          {isFaced(entry) ? (
            <Stamp tone="alarm" className="text-base">
              {t.myFile.faced}
            </Stamp>
          ) : (
            <span className={`label-mono ${verdict?.tone === 'safe' ? 'text-sickly' : 'text-bone/60'}`}>
              {verdict ? t.verdict.kinds[verdict.kind].title : t.myFile.inProgress}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}

function EmptyFile() {
  const lang = useLang()
  const t = useT()
  return (
    <div className="flex flex-col items-start gap-6 border border-ash bg-ink-2 p-8">
      <p className="font-serif text-lg text-bone/80">{t.myFile.empty}</p>
      <Link to="/$lang/dossiers" params={{ lang }} className={actionClasses('primary')}>
        {t.myFile.openArchives}
      </Link>
    </div>
  )
}

function ForgetButton() {
  const t = useT()
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <ActionButton variant="ghost" className="mt-10" onClick={() => setConfirming(true)}>
        {t.myFile.forget}
      </ActionButton>
    )
  }

  return (
    <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <p className="font-serif text-bone/80">{t.myFile.forgetConfirm}</p>
      <ActionButton variant="escape" onClick={forgetEverything}>
        {t.myFile.forgetYes}
      </ActionButton>
      <ActionButton variant="ghost" onClick={() => setConfirming(false)}>
        {t.myFile.forgetCancel}
      </ActionButton>
    </div>
  )
}
