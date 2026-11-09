import { useQuery } from '@tanstack/react-query'

async function fetchHealth(): Promise<{ status: string }> {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`)
  return response.json()
}

export function ApiStatus() {
  const { isPending, isSuccess } = useQuery({ queryKey: ['health'], queryFn: fetchHealth })

  if (isPending) return <StatusLine tone="text-bone/50">Connexion…</StatusLine>
  return isSuccess ? (
    <StatusLine tone="text-sickly">API en ligne</StatusLine>
  ) : (
    <StatusLine tone="text-rust">API injoignable</StatusLine>
  )
}

function StatusLine({ tone, children }: { tone: string; children: string }) {
  return (
    <p className={`font-mono text-xs uppercase tracking-[0.2em] ${tone}`} role="status">
      {children}
    </p>
  )
}
