import type { ReactNode } from 'react'
import { useLang, useT } from '../i18n/context'
import { LOCALES } from '../i18n/languages'
import { CONTACT_URL, GOOGLE_PRIVACY_URL, HOST, LEGAL_UPDATED, PUBLISHER } from '../legal/publisher'
import { pageTitle, useDocumentTitle } from '../ui/documentTitle'

const LINK = 'text-bone underline decoration-rust-bright underline-offset-4 hover:text-rust-bright'

/** Legal notice and privacy: who publishes and hosts the site, and what it keeps (nothing on its side). */
export function LegalPage() {
  const lang = useLang()
  const t = useT()
  const { legal } = t
  useDocumentTitle(pageTitle(legal.title))
  const updated = new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'long' }).format(LEGAL_UPDATED)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 flex flex-col gap-3">
        <p className="label-mono text-clinical">{legal.kicker}</p>
        <h1 className="font-display text-5xl font-black break-words uppercase sm:text-7xl">{legal.title}</h1>
        <p className="label-mono text-clinical">{legal.updated(updated)}</p>
      </header>

      <Section title={legal.publisher.heading}>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
          <Entry label={legal.publisher.name} value={PUBLISHER.name} />
          <Entry label={legal.publisher.form} value={PUBLISHER.form} />
          <Entry label={legal.publisher.registration} value={PUBLISHER.registration} />
          <Entry label={legal.publisher.office} value={PUBLISHER.office} />
          <Entry label={legal.publisher.director} value={PUBLISHER.director} />
        </dl>
      </Section>

      <Section title={legal.host.heading}>
        <p>
          {HOST.name}
          <br />
          {HOST.address}
          <br />
          {legal.host.phone} {HOST.phone}
        </p>
        <p>{legal.host.region}</p>
      </Section>

      <Section title={legal.contact.heading}>
        <p>{legal.contact.text}</p>
        <p>
          <a href={CONTACT_URL} className={LINK} target="_blank" rel="noreferrer">
            {legal.contact.link}
          </a>
        </p>
      </Section>

      <Section title={legal.privacy.heading}>
        <p>{legal.privacy.nothing}</p>
        <p>{legal.privacy.storageIntro}</p>
        <ul className="list-disc pl-6">
          <li>{legal.privacy.storageLang}</li>
          <li>{legal.privacy.storageFile}</li>
          <li>{legal.privacy.storageRound}</li>
        </ul>
        <p>{legal.privacy.erase}</p>
        <p>{legal.privacy.server}</p>
        <p>
          {legal.privacy.youtube}{' '}
          <a href={GOOGLE_PRIVACY_URL} className={LINK} target="_blank" rel="noreferrer">
            {legal.privacy.youtubeLink}
          </a>
        </p>
        <p>{legal.privacy.rights}</p>
      </Section>

      <Section title={legal.media.heading}>
        <p>{legal.media.text}</p>
      </Section>

      <Section title={t.legal.health}>
        <p>{t.footer.disclaimer}</p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-ash py-8">
      <h2 className="label-mono mb-4 text-rust-bright">{title}</h2>
      <div className="flex flex-col gap-3 font-serif text-lg text-bone/80">{children}</div>
    </section>
  )
}

function Entry({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="label-mono pt-1 text-clinical">{label}</dt>
      <dd className="text-bone">{value}</dd>
    </>
  )
}
