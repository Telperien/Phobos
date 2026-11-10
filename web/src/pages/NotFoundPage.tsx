import { Link } from '@tanstack/react-router'
import { useLang, useT } from '../i18n/context'
import { actionClasses } from '../ui/ActionButton'
import { useDocumentTitle } from '../ui/documentTitle'
import { Stamp } from '../ui/Stamp'

/** Unknown case file or unknown address. */
export function NotFoundPage() {
  const lang = useLang()
  const t = useT()
  const { missing } = t.caseFile
  useDocumentTitle(t.meta.title)

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-24">
      <Stamp tone="bone" className="text-4xl">
        {missing.stamp}
      </Stamp>
      <p className="font-serif text-lg text-bone/70">{missing.text}</p>
      <Link to="/$lang/dossiers" params={{ lang }} className={actionClasses('ghost')}>
        {missing.back}
      </Link>
    </div>
  )
}
