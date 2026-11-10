import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { catalogueQuery, phobiaQuery } from '../api/client'
import { CaseFileJourney } from '../exposure/CaseFileJourney'
import { useLang, useT } from '../i18n/context'
import { actionClasses } from '../ui/ActionButton'
import { pageTitle, useDocumentTitle } from '../ui/documentTitle'
import { LoadFailure, LoadingLine } from '../ui/LoadState'
import { NotFoundPage } from './NotFoundPage'

export function PhobiaPage() {
  const t = useT()
  const { slug } = useParams({ from: '/$lang/dossiers/$slug' })
  // Switching language keeps the case file on screen (and the journey where it is) until the translation arrives.
  const phobia = useQuery({ ...phobiaQuery(useLang(), slug), placeholderData: keepPreviousData })
  useDocumentTitle(phobia.data ? pageTitle(phobia.data.name) : undefined)

  if (phobia.isPending)
    return (
      <PageFrame>
        <LoadingLine>{t.caseFile.loading}</LoadingLine>
      </PageFrame>
    )
  if (phobia.isError)
    return (
      <PageFrame>
        <LoadFailure onRetry={() => phobia.refetch()} />
      </PageFrame>
    )
  if (phobia.data === null) return <NotFoundPage />
  return <CaseFileJourney key={slug} phobia={phobia.data} next={<NextCaseFileLink slug={slug} />} />
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
}

/** Next case file in catalogue order, wrapping around after the last one. */
function NextCaseFileLink({ slug }: { slug: string }) {
  const lang = useLang()
  const t = useT()
  const list = useQuery(catalogueQuery(lang)).data ?? []
  const next = list[(list.findIndex((item) => item.slug === slug) + 1) % Math.max(list.length, 1)]
  if (!next) return null

  return (
    <Link to="/$lang/dossiers/$slug" params={{ lang, slug: next.slug }} className={actionClasses('primary')}>
      {t.caseFile.next} <span aria-hidden="true">→</span>
    </Link>
  )
}
