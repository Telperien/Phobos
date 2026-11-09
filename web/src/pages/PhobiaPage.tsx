import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { catalogueQuery, LANG, phobiaQuery } from '../api/client'
import { CaseFileJourney } from '../exposure/CaseFileJourney'
import { actionClasses } from '../ui/ActionButton'
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
  return <CaseFileJourney key={slug} phobia={phobia.data} next={<NextCaseFileLink slug={slug} />} />
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
}

/** Next case file in catalogue order, wrapping around after the last one. */
function NextCaseFileLink({ slug }: { slug: string }) {
  const list = useQuery(catalogueQuery(LANG)).data ?? []
  const next = list[(list.findIndex((item) => item.slug === slug) + 1) % Math.max(list.length, 1)]
  if (!next) return null

  return (
    <Link to="/dossiers/$slug" params={{ slug: next.slug }} className={actionClasses('primary')}>
      Dossier suivant <span aria-hidden="true">→</span>
    </Link>
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
