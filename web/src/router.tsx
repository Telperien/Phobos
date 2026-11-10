import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { type CatalogueSearch, parseCatalogueSearch, toCatalogueSearch } from './catalogue/filter'
import { isLang, pathInLanguage, preferredLanguage } from './i18n/languages'
import { LangLayout } from './layout/RootLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { parseRouletteSearch, type RouletteSearch, toRouletteSearch } from './roulette/round'

/** Each page is its own chunk of JavaScript, loaded when the visitor goes there. */
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

const homeRoute = createRoute({
  getParentRoute: () => langRoute,
  path: '/',
  component: lazyRouteComponent(() => import('./pages/HomePage'), 'HomePage'),
})

const catalogueRoute = createRoute({
  getParentRoute: () => langRoute,
  path: 'dossiers',
  validateSearch: (search: Record<string, unknown>): CatalogueSearch =>
    toCatalogueSearch(parseCatalogueSearch(search)),
  component: lazyRouteComponent(() => import('./pages/CataloguePage'), 'CataloguePage'),
})

const phobiaRoute = createRoute({
  getParentRoute: () => langRoute,
  path: 'dossiers/$slug',
  component: lazyRouteComponent(() => import('./pages/PhobiaPage'), 'PhobiaPage'),
})

const rouletteRoute = createRoute({
  getParentRoute: () => langRoute,
  path: 'roulette',
  validateSearch: (search: Record<string, unknown>): RouletteSearch =>
    toRouletteSearch(parseRouletteSearch(search)),
  component: lazyRouteComponent(() => import('./pages/RoulettePage'), 'RoulettePage'),
})

const myFileRoute = createRoute({
  getParentRoute: () => langRoute,
  path: 'mon-dossier',
  component: lazyRouteComponent(() => import('./pages/MyFilePage'), 'MyFilePage'),
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
