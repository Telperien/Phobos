import { type ReactNode, useRef, useState } from 'react'
import { useT } from '../i18n/context'

const ARROW =
  'inline-flex size-11 cursor-pointer items-center justify-center border-2 border-bone/40 font-display text-xl text-bone transition hover:border-bone hover:bg-bone/10 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent'

/**
 * Several plates of one level, side by side: swipe on a phone, arrows and a counter everywhere.
 * A single plate is shown as it is.
 */
export function ImageCarousel({ slides, label }: { slides: readonly ReactNode[]; label: string }) {
  const t = useT()
  const track = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const count = slides.length

  if (count === 1) return <>{slides[0]}</>

  const goTo = (index: number) => {
    const element = track.current
    if (!element) return
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollTo({ left: index * element.clientWidth, behavior: instant ? 'auto' : 'smooth' })
  }

  return (
    <section aria-roledescription="carousel" aria-label={label} className="flex flex-col gap-3">
      <div
        ref={track}
        // Focusable, so the keyboard arrows scroll it too.
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard
        tabIndex={0}
        onScroll={(event) => {
          const { scrollLeft, clientWidth } = event.currentTarget
          setCurrent(Math.round(scrollLeft / Math.max(clientWidth, 1)))
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-bone [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: plates keep their order
            key={index}
            className="w-full shrink-0 snap-center"
          >
            {slide}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="label-mono text-clinical" aria-live="polite">
          {t.journey.carousel.position(current + 1, count)}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className={ARROW}
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            aria-label={t.journey.carousel.previous}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className={ARROW}
            onClick={() => goTo(current + 1)}
            disabled={current === count - 1}
            aria-label={t.journey.carousel.next}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}
