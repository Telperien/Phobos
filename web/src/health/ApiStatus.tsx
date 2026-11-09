import { useQuery } from '@tanstack/react-query'
import { useT } from '../i18n/context'

async function fetchHealth(): Promise<{ status: string }> {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`)
  return response.json()
}

export function ApiStatus() {
  const t = useT()
  const { isPending, isSuccess } = useQuery({ queryKey: ['health'], queryFn: fetchHealth })

  if (isPending) return <StatusLine tone="text-bone/50">{t.status.connecting}</StatusLine>
  return isSuccess ? (
    <StatusLine tone="text-sickly">{t.status.online}</StatusLine>
  ) : (
    <StatusLine tone="text-rust">{t.status.offline}</StatusLine>
  )
}

function StatusLine({ tone, children }: { tone: string; children: string }) {
  return (
    <p className={`font-mono text-xs uppercase tracking-[0.2em] ${tone}`} role="status">
      {children}
    </p>
  )
}
