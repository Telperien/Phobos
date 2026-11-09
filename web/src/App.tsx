import { ApiStatus } from './health/ApiStatus'

export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-4">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-bone/50">Archives — Dossier n°000</p>
      <h1 className="text-6xl font-bold uppercase tracking-tight sm:text-8xl">Phobos</h1>
      <p className="max-w-prose text-lg text-bone/80">Trouve ta peur. Bientôt.</p>
      <ApiStatus />
    </main>
  )
}
