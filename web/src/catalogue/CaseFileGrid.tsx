import type { PhobiaSummary } from '../api/client'
import { useLogbook } from '../logbook/store'
import { CaseFileCard } from './CaseFileCard'

export function CaseFileGrid({ phobias, className = '' }: { phobias: PhobiaSummary[]; className?: string }) {
  const logbook = useLogbook()
  return (
    <div className={`grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {phobias.map((phobia, index) => (
        <CaseFileCard key={phobia.slug} phobia={phobia} index={index} entry={logbook[phobia.slug]} />
      ))}
    </div>
  )
}
