import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexProvider } from 'convex/react'
import { routeTree } from './routeTree.gen'

function getConvexUrl(): string {
  // Check process.env first (for SSR/server-side)
  if (typeof process !== 'undefined' && process.env?.CONVEX_URL) {
    return process.env.CONVEX_URL
  }
  if (typeof process !== 'undefined' && process.env?.VITE_CONVEX_URL) {
    return process.env.VITE_CONVEX_URL
  }
  // Fall back to import.meta.env (for client-side)
  const metaEnv = (import.meta as any).env
  if (metaEnv?.VITE_CONVEX_URL) {
    return metaEnv.VITE_CONVEX_URL
  }
  throw new Error('Missing CONVEX_URL or VITE_CONVEX_URL environment variable')
}

export function getRouter() {
  const CONVEX_URL = getConvexUrl()
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: 'intent',
      context: { queryClient },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0, // Let React Query handle all caching
      defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
      defaultNotFoundComponent: () => <p>not found</p>,
      Wrap: ({ children }) => (
        <ConvexProvider client={convexQueryClient.convexClient}>
          {children}
        </ConvexProvider>
      ),
    }),
    queryClient,
  )

  return router
}
