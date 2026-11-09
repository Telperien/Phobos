import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiStatus } from './ApiStatus'

function renderWithApi(fetchImpl: typeof fetch) {
  vi.stubGlobal('fetch', fetchImpl)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ApiStatus />
    </QueryClientProvider>,
  )
}

describe('ApiStatus', () => {
  it('says the API is online when /api/health answers ok', async () => {
    renderWithApi(vi.fn(async () => Response.json({ status: 'ok' })))

    expect(await screen.findByText('API en ligne')).toBeInTheDocument()
  })

  it('says the API is unreachable when the request fails', async () => {
    renderWithApi(vi.fn(async () => new Response(null, { status: 503 })))

    expect(await screen.findByText('API injoignable')).toBeInTheDocument()
  })
})
