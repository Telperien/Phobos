/** Emplacement d'image en attendant les images IA : planche photographique hachurée. */
export function MediaPlaceholder({ plate, caption }: { plate: string; caption: string }) {
  return (
    <figure className="relative flex aspect-[4/3] w-full flex-col justify-between overflow-hidden border border-ash bg-ink-2 p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, var(--color-ash) 0 1px, transparent 1px 14px)',
        }}
      />
      <Corners />
      <span className="relative label-mono text-clinical">Planche {plate}</span>
      <figcaption className="relative max-w-xs font-serif text-sm italic text-bone/60">{caption}</figcaption>
    </figure>
  )
}

/** Coins de montage photo. */
function Corners() {
  const corner = 'absolute size-4 border-bone/50'
  return (
    <>
      <span className={`${corner} top-2 left-2 border-t border-l`} />
      <span className={`${corner} top-2 right-2 border-t border-r`} />
      <span className={`${corner} bottom-2 left-2 border-b border-l`} />
      <span className={`${corner} right-2 bottom-2 border-r border-b`} />
    </>
  )
}
