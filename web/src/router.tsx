import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { type CatalogueSearch, parseCatalogueSearch, toCatalogueSearch } from './catalogue/filter'
import { RootLayout } from './layout/RootLayout'
import { CataloguePage } from './pages/CataloguePage'
import { HomePage } from './pages/HomePage'
import { MyFilePage } from './pages/MyFilePage'
import { PhobiaPage } from './pages/PhobiaPage'
import { RoulettePage } from './pages/RoulettePage'

const rootRoute = createRootRoute({ component: RootLayout })

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })

const catalogueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dossiers',
  validateSearch: (search: Record<string, unknown>): CatalogueSearch =>
    toCatalogueSearch(parseCatalogueSearch(search)),
  component: CataloguePage,
})

const phobiaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dossiers/$slug',
  component: PhobiaPage,
})

const rouletteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/roulette',
  component: RoulettePage,
})

const myFileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mon-dossier',
  component: MyFilePage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute, catalogueRoute, phobiaRoute, rouletteRoute, myFileRoute]),
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
