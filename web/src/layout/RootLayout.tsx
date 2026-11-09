import { Link, Outlet } from '@tanstack/react-router'
import { ApiStatus } from '../health/ApiStatus'
import { isFaced } from '../logbook/logbook'
import { useLogbook } from '../logbook/store'

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

const navLink = 'text-bone/80 hover:text-bone [&.active]:text-bone [&.active]:underline underline-offset-8'

function SiteHeader() {
  const faced = Object.values(useLogbook()).filter(isFaced).length

  return (
    <header className="sticky top-0 z-30 border-b border-ash bg-ink/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="font-display text-2xl font-black tracking-wide uppercase">Phobos</span>
          <span className="hidden label-mono text-clinical md:inline">Archives des peurs</span>
        </Link>
        <nav className="flex items-center gap-4 label-mono sm:gap-5">
          <Link to="/dossiers" className={navLink}>
            Archives
          </Link>
          <Link to="/roulette" className={`${navLink} hover:text-rust-bright`}>
            Roulette
          </Link>
          <Link to="/mon-dossier" className={`${navLink} flex items-center gap-1.5`}>
            <span className="hidden sm:inline">Mon dossier</span>
            <span className="sm:hidden">Moi</span>
            {faced > 0 && (
              <span className="bg-rust px-1.5 py-0.5 text-bone" title={`${faced} phobies affrontées`}>
                {faced}
              </span>
            )}
          </Link>
          <span
            className="hidden border border-ash px-2 py-1 text-clinical sm:inline"
            title="Langues : étape 5"
          >
            FR
          </span>
        </nav>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-ash">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-md font-serif text-sm text-bone/60">
          Phobos n’est pas un outil de diagnostic. Si une peur t’empêche de vivre normalement, parles-en à un
          professionnel de santé.
        </p>
        <div className="flex flex-col gap-1 sm:items-end">
          <span className="label-mono text-clinical">Archives ouvertes le 09.11.2026</span>
          {import.meta.env.DEV && <ApiStatus />}
        </div>
      </div>
    </footer>
  )
}
