import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { catalogueQuery } from '../api/client'
import { categoryName } from '../catalogue/categories'
import { useLang, useT } from '../i18n/context'
import { useLogbook } from '../logbook/store'
import { fearProfile } from './profile'

/** "Your fear profile": what the logbook says about the visitor, computed in the browser. */
export function FearProfilePanel() {
  const lang = useLang()
  const t = useT()
  const logbook = useLogbook()
  const catalogue = useQuery(catalogueQuery(lang)).data ?? []
  const profile = fearProfile(logbook, catalogue)

  return (
    <section
      aria-labelledby="fear-profile-title"
      className="flex flex-col gap-6 border border-ash bg-ink-2 p-6 sm:p-8"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ash pb-3">
        <h2 id="fear-profile-title" className="font-display text-3xl font-black uppercase">
          {t.profile.title}
        </h2>
        <p className="label-mono text-clinical">
          {t.profile.counts(profile.faced, catalogue.length, profile.opened)}
        </p>
      </header>

      {profile.opened === 0 ? (
        <p className="font-serif text-lg text-bone/70">{t.profile.empty}</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {profile.verdicts.map(({ kind, tone, count }) => (
              <div key={kind} className="flex flex-col gap-1 border-l-2 border-ash pl-3">
                <dt className={`label-mono ${tone === 'safe' ? 'text-sickly' : 'text-rust-bright'}`}>
                  {t.verdict.kinds[kind].title}
                </dt>
                <dd className="font-display text-5xl font-black">{count}</dd>
              </div>
            ))}
          </dl>
          <dl className="grid gap-3 font-serif text-lg sm:grid-cols-2">
            <div>
              <dt className="label-mono text-clinical">{t.profile.dominant}</dt>
              <dd>
                {profile.dominantCategory
                  ? categoryName(t.categories, profile.dominantCategory)
                  : t.profile.noDominant}
              </dd>
            </div>
            <div>
              <dt className="label-mono text-clinical">{t.profile.worst}</dt>
              <dd>
                {profile.worst ? (
                  <Link
                    to="/$lang/dossiers/$slug"
                    params={{ lang, slug: profile.worst.slug }}
                    className="underline decoration-rust underline-offset-4 hover:text-rust-bright"
                  >
                    {t.profile.worstLine(profile.worst.name, profile.worst.level)}
                  </Link>
                ) : (
                  t.profile.noWorst
                )}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  )
}
