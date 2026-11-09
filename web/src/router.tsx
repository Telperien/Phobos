import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { type CatalogueSearch, parseCatalogueSearch, toCatalogueSearch } from './catalogue/filter'
import { isLang, pathInLanguage, preferredLanguage } from './i18n/languages'
import { LangLayout } from './layout/RootLayout'
import { CataloguePage } from './pages/CataloguePage'
import { HomePage } from './pages/HomePage'
import { MyFilePage } from './pages/MyFilePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PhobiaPage } from './pages/PhobiaPage'
import { RoulettePage } from './pages/RoulettePage'
import { parseRouletteSearch, type RouletteSearch, toRouletteSearch } from './roulette/round'

const rootRoute = createRootRoute({ component: Outlet })

/** `/` sends visitors to their language: saved choice, then browser, then English. */
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/$lang', params: { lang: preferredLanguage() }, replace: true })
  },
})

/** Every page lives under a language prefix; an address without one (`/dossiers`) gets it added. */
export const langRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$lang',
  beforeLoad: ({ params, location }) => {
    if (isLang(params.lang)) return
    throw redirect({
      href: `${pathInLanguage(location.pathname, preferredLanguage())}${location.searchStr}`,
      replace: true,
    })
  },
  component: LangLayout,
  notFoundComponent: NotFoundPage,
})

const homeRoute = createRoute({ getParentRoute: () => langRoute, path: '/', component: HomePage })

const catalogueRoute = createRoute({
  getParentRoute: () => langRoute,
  path: 'dossiers',
  validateSearch: (search: Record<string, unknown>): CatalogueSearch =>
    toCatalogueSearch(parseCatalogueSearch(search)),
  component: CataloguePage,
})

const phobiaRoute = createRoute({
  getParentRoute: () => langRoute,
  path: 'dossiers/$slug',
  component: PhobiaPage,
})

const rouletteRoute = createRoute({
  getParentRoute: () => langRoute,
  path: 'roulette',
  validateSearch: (search: Record<string, unknown>): RouletteSearch =>
    toRouletteSearch(parseRouletteSearch(search)),
  component: RoulettePage,
})

const myFileRoute = createRoute({
  getParentRoute: () => langRoute,
  path: 'mon-dossier',
  component: MyFilePage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    langRoute.addChildren([homeRoute, catalogueRoute, phobiaRoute, rouletteRoute, myFileRoute]),
  ]),
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
