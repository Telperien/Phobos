import { useT } from '../i18n/context'
import { EXPOSURE_LEVELS, FINAL_LEVEL, type LevelNumber } from './levels'

export function FearGauge({ level }: { level: LevelNumber }) {
  const t = useT()

  return (
    // biome-ignore lint/a11y/useSemanticElements: a native <meter> cannot draw labelled segments
    <div
      role="meter"
      aria-label={t.journey.gauge}
      aria-valuemin={1}
      aria-valuemax={FINAL_LEVEL}
      aria-valuenow={level}
      aria-valuetext={t.journey.gaugeValue(level, t.levels[level].name)}
    >
      <ol className="grid grid-cols-5 gap-1.5">
        {EXPOSURE_LEVELS.map((number) => {
          const reached = number <= level
          return (
            <li key={number} data-reached={reached} className="group flex flex-col gap-2">
              <span
                className={`h-1.5 transition-colors duration-500 ${
                  reached ? 'bg-rust-bright' : 'bg-ash'
                } ${number === level ? 'animate-flicker' : ''}`}
              />
              <span
                className={`label-mono tracking-normal sm:tracking-[0.2em] ${reached ? 'text-bone' : 'text-clinical/60'}`}
              >
                <span className="text-rust-bright">0{number}</span> {t.levels[number].name}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
