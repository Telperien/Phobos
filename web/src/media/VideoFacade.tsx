/**
 * Façade vidéo (maquette) : rien n'est chargé depuis YouTube tant qu'on ne clique pas.
 * Le vrai lecteur youtube-nocookie arrive à l'étape 3.
 */
export function VideoFacade({ title }: { title: string }) {
  return (
    <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 border border-ash bg-ink-2 p-6 text-center">
      <span className="absolute top-3 left-3 label-mono text-rust-bright">● Rec — Niveau 03</span>
      <button
        type="button"
        aria-label={`Lancer la vidéo : ${title}`}
        className="group flex size-20 items-center justify-center border border-bone/70 transition-colors hover:border-rust-bright hover:bg-rust"
      >
        <svg viewBox="0 0 24 24" className="size-8 fill-bone" aria-hidden="true">
          <path d="M7 4v16l13-8z" />
        </svg>
      </button>
      <p className="max-w-sm font-serif text-sm text-bone/60">
        Avertissement : images rapides et sons forts. Déconseillé aux personnes photosensibles.
      </p>
    </div>
  )
}
