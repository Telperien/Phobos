import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { catalogueQuery, LANG } from '../api/client'
import { categoryLabel } from '../catalogue/categories'
import { useLogbook } from '../logbook/store'
import { fearProfile } from './profile'

/** "Ton profil de peurs": what the logbook says about the visitor, computed in the browser. */
export function FearProfilePanel() {
  const logbook = useLogbook()
  const catalogue = useQuery(catalogueQuery(LANG)).data ?? []
  const profile = fearProfile(logbook, catalogue)

  return (
    <section
      aria-labelledby="fear-profile-title"
      className="flex flex-col gap-6 border border-ash bg-ink-2 p-6 sm:p-8"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ash pb-3">
        <h2 id="fear-profile-title" className="font-display text-3xl font-black uppercase">
          Ton profil de peurs
        </h2>
        <p className="label-mono text-clinical">
          {profile.faced} / {catalogue.length} affrontées · {profile.opened} ouverte
          {profile.opened > 1 ? 's' : ''}
        </p>
      </header>

      {profile.opened === 0 ? (
        <p className="font-serif text-lg text-bone/70">
          Profil vierge. Va au bout d’un premier dossier pour lancer l’analyse.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {profile.verdicts.map(({ title, tone, count }) => (
              <div key={title} className="flex flex-col gap-1 border-l-2 border-ash pl-3">
                <dt className={`label-mono ${tone === 'safe' ? 'text-sickly' : 'text-rust-bright'}`}>
                  {title}
                </dt>
                <dd className="font-display text-5xl font-black">{count}</dd>
              </div>
            ))}
          </dl>
          <dl className="grid gap-3 font-serif text-lg sm:grid-cols-2">
            <div>
              <dt className="label-mono text-clinical">Peur dominante</dt>
              <dd>
                {profile.dominantCategory
                  ? categoryLabel(profile.dominantCategory)
                  : 'Aucune, pour l’instant'}
              </dd>
            </div>
            <div>
              <dt className="label-mono text-clinical">Pire réaction</dt>
              <dd>
                {profile.worst ? (
                  <Link
                    to="/dossiers/$slug"
                    params={{ slug: profile.worst.slug }}
                    className="underline decoration-rust underline-offset-4 hover:text-rust-bright"
                  >
                    {profile.worst.name} — arrêt au niveau {profile.worst.level}
                  </Link>
                ) : (
                  'Rien ne t’a fait reculer'
                )}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  )
}
