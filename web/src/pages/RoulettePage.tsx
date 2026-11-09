import { useQuery } from '@tanstack/react-query'
import { Navigate } from '@tanstack/react-router'
import { drawPhobia, LANG } from '../api/client'
import { LoadFailure, LoadingLine } from '../ui/LoadState'

/** Provisional roulette: draws one case file and opens it. The real infinite mode comes in step 4. */
export function RoulettePage() {
  const draw = useQuery({
    queryKey: ['roulette', LANG],
    queryFn: () => drawPhobia(LANG, []),
    gcTime: 0,
    staleTime: 0,
  })

  if (draw.data) return <Navigate to="/dossiers/$slug" params={{ slug: draw.data.slug }} replace />

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {draw.isError || draw.data === null ? (
        <LoadFailure onRetry={() => draw.refetch()} />
      ) : (
        <LoadingLine>La roulette tourne…</LoadingLine>
      )}
    </div>
  )
}
