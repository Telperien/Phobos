import type { MediaView } from '../api/client'
import { useT } from '../i18n/context'

/** Credit line under an image found on the web: author and licence, linked to the original. */
export function ImageCredit({ credit }: { credit: MediaView['credit'] }) {
  const t = useT()
  if (!credit) return null

  return (
    <a
      href={credit.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-[0.65rem] tracking-wide text-clinical underline-offset-4 hover:text-bone hover:underline"
    >
      {t.journey.credit(credit.author, credit.license)}
    </a>
  )
}
