import { useState } from 'react'
import type { PhobiaDetail } from '../api/client'
import { categoryName } from '../catalogue/categories'
import type { LevelNumber } from '../exposure/levels'
import { type ExitChoice, verdictFor } from '../exposure/verdict'
import { useLang, useT } from '../i18n/context'
import { ActionButton } from '../ui/ActionButton'
import { caseLabel } from '../ui/caseLabel'
import { renderVerdictCard } from './card'
import { type ShareOutcome, shareCard } from './share'

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "Share my verdict": draws the verdict card, then shares it (phones) or downloads it (desktop). */
export function ShareVerdictButton({
  phobia,
  outcome,
}: {
  phobia: PhobiaDetail
  outcome: { level: LevelNumber; choice: ExitChoice }
}) {
  const lang = useLang()
  const t = useT()
  const [state, setState] = useState<'idle' | 'busy' | 'failed' | ShareOutcome>('idle')

  const share = async () => {
    setState('busy')
    try {
      const verdict = verdictFor(outcome.level, outcome.choice)
      const text = t.verdict.kinds[verdict.kind]
      const blob = await renderVerdictCard({
        caseFile: t.caseFile.file(caseLabel(phobia.caseNumber)),
        category: categoryName(t.categories, phobia.category),
        name: phobia.name,
        etymology: phobia.etymology,
        verdict: text.title,
        tone: verdict.tone,
        detail: text.detail(outcome.level),
        reached: t.card.reached(outcome.level),
        footer: t.meta.title,
        host: window.location.host,
        imageSource: phobia.levels[0]?.media.find((media) => media.kind === 'image')?.source,
      })
      const file = new File([blob], `phobos-${phobia.slug}-${verdict.kind}.png`, { type: 'image/png' })
      const url = `${window.location.origin}/${lang}/dossiers/${phobia.slug}`
      setState(
        await shareCard(
          { file, title: t.meta.title, text: t.share.text(phobia.name, text.title), url },
          navigator,
          downloadFile,
        ),
      )
    } catch {
      setState('failed')
    }
  }

  const status = { busy: t.share.preparing, downloaded: t.share.downloaded, failed: t.share.failed }

  return (
    <div className="flex flex-col gap-2">
      <ActionButton variant="ghost" onClick={share} disabled={state === 'busy'}>
        {t.share.button}
      </ActionButton>
      <p role="status" className="label-mono text-clinical">
        {state in status ? status[state as keyof typeof status] : ''}
      </p>
    </div>
  )
}
