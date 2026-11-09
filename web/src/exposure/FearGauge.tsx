import { EXPOSURE_LEVELS, type LevelNumber } from './levels'

export function FearGauge({ level }: { level: LevelNumber }) {
  const current = EXPOSURE_LEVELS[level - 1]

  return (
    // biome-ignore lint/a11y/useSemanticElements: a native <meter> cannot draw labelled segments
    <div
      role="meter"
      aria-label="Jauge de frisson"
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={level}
      aria-valuetext={`Niveau ${level} sur 3 : ${current.name}`}
    >
      <ol className="grid grid-cols-3 gap-1.5">
        {EXPOSURE_LEVELS.map(({ number, name }) => {
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
                <span className="text-rust-bright">0{number}</span> {name}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
