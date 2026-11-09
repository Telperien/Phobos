import { useState } from 'react'

interface YouTubeFacadeProps {
  videoId: string
  startSeconds: number
  title: string
}

/** Nothing is loaded from YouTube until the visitor clicks: no cookies, no tracking, faster page. */
export function YouTubeFacade({ videoId, startSeconds, title }: YouTubeFacadeProps) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <iframe
        title={`Vidéo : ${title}`}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&start=${startSeconds}&rel=0&modestbranding=1`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full border border-ash bg-ink"
      />
    )
  }

  return (
    <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden border border-ash bg-ink-2 p-6 text-center">
      <span className="absolute top-3 left-3 label-mono text-rust-bright">● Rec — Niveau 03</span>
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Lancer la vidéo : ${title}`}
        className="relative flex size-20 items-center justify-center border border-bone/70 bg-ink/60 transition-colors hover:border-rust-bright hover:bg-rust"
      >
        <svg viewBox="0 0 24 24" className="size-8 fill-bone" aria-hidden="true">
          <path d="M7 4v16l13-8z" />
        </svg>
      </button>
      <p className="relative max-w-sm font-serif text-sm text-bone/70">
        Avertissement : images rapides et sons forts. Déconseillé aux personnes photosensibles.
      </p>
    </div>
  )
}
