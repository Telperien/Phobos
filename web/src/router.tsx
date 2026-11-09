import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from './layout/RootLayout'
import { HomePage } from './pages/HomePage'
import { PhobiaPage } from './pages/PhobiaPage'

const rootRoute = createRootRoute({ component: RootLayout })

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })

const phobiaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dossiers/$slug',
  component: PhobiaPage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute, phobiaRoute]),
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
