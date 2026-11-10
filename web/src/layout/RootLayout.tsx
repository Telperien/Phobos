import { Link, Outlet, useLocation, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { localStore } from '../browserStorage'
import { ApiStatus } from '../health/ApiStatus'
import { LangProvider, useLang, useT } from '../i18n/context'
import { FALLBACK_LANG, isLang, LANGS, LOCALES, pathInLanguage, saveLanguage } from '../i18n/languages'
import { MESSAGES } from '../i18n/messages'
import { isFaced } from '../logbook/logbook'
import { useLogbook } from '../logbook/store'

/** Layout of every page under `/$lang`: provides the language, labels the document with it. */
export function LangLayout() {
  const { lang: param } = useParams({ from: '/$lang' })
  const lang = isLang(param) ? param : FALLBACK_LANG

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LangProvider lang={lang}>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </LangProvider>
  )
}

const navLink = 'text-bone/80 hover:text-bone [&.active]:text-bone [&.active]:underline underline-offset-8'

function SiteHeader() {
  const lang = useLang()
  const t = useT()
  const faced = Object.values(useLogbook()).filter(isFaced).length

  return (
    <header className="sticky top-0 z-30 border-b border-ash bg-ink/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/$lang" params={{ lang }} className="flex items-baseline gap-3">
          <span className="font-display text-2xl font-black tracking-wide uppercase">Phobos</span>
          <span className="hidden label-mono text-clinical md:inline">{t.nav.tagline}</span>
        </Link>
        <nav className="flex items-center gap-3 label-mono sm:gap-5">
          <Link to="/$lang/dossiers" params={{ lang }} className={navLink}>
            {t.nav.archives}
          </Link>
          <Link to="/$lang/roulette" params={{ lang }} className={`${navLink} hover:text-rust-bright`}>
            {t.nav.roulette}
          </Link>
          <Link to="/$lang/mon-dossier" params={{ lang }} className={`${navLink} flex items-center gap-1.5`}>
            <span className="hidden sm:inline">{t.nav.myFile}</span>
            <span className="sm:hidden">{t.nav.myFileShort}</span>
            {faced > 0 && (
              <span className="bg-rust px-1.5 py-0.5 text-bone" title={t.nav.facedBadge(faced)}>
                {faced}
              </span>
            )}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}

/** Same page in another language; the choice is remembered for the next visit to `/`. */
function LanguageSwitcher() {
  const lang = useLang()
  const t = useT()
  const { pathname, searchStr } = useLocation()
  const navigate = useNavigate()

  return (
    <div className="relative flex items-center border border-ash text-clinical focus-within:border-bone hover:border-bone/60">
      <select
        aria-label={t.nav.language}
        value={lang}
        onChange={(event) => {
          const next = event.target.value
          if (!isLang(next)) return
          saveLanguage(localStore(), next)
          navigate({ href: `${pathInLanguage(pathname, next)}${searchStr}` })
        }}
        className="cursor-pointer appearance-none bg-transparent py-1 pr-6 pl-2 uppercase focus:outline-none"
      >
        {LANGS.map((code) => (
          <option
            key={code}
            value={code}
            title={MESSAGES[code].meta.languageName}
            className="bg-ink text-bone"
          >
            {code.toUpperCase()}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-2 text-[0.6rem]">
        ▼
      </span>
    </div>
  )
}

const OPENING_DAY = new Date('2026-11-09T12:00:00Z')

function SiteFooter() {
  const lang = useLang()
  const t = useT()
  const opened = new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'long' }).format(OPENING_DAY)

  return (
    <footer className="border-t border-ash">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-md font-serif text-sm text-bone/60">{t.footer.disclaimer}</p>
        <div className="flex flex-col gap-1 sm:items-end">
          <span className="label-mono text-clinical">{t.footer.opened(opened)}</span>
          {import.meta.env.DEV && <ApiStatus />}
        </div>
      </div>
    </footer>
  )
}
