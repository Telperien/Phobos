import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { catalogueQuery, LANG } from '../api/client'
import { CaseFileGrid } from '../catalogue/CaseFileGrid'
import { CATEGORIES } from '../catalogue/categories'
import {
  type CatalogueFilter,
  filterCatalogue,
  parseCatalogueSearch,
  toCatalogueSearch,
} from '../catalogue/filter'
import { isFaced } from '../logbook/logbook'
import { useLogbook } from '../logbook/store'
import { LoadFailure, LoadingLine } from '../ui/LoadState'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'faced', label: 'Affrontées' },
  { value: 'todo', label: 'À tenter' },
] as const

export function CataloguePage() {
  const filter = parseCatalogueSearch(useSearch({ from: '/dossiers' }))
  const navigate = useNavigate({ from: '/dossiers' })
  const logbook = useLogbook()
  const catalogue = useQuery(catalogueQuery(LANG))

  const change = (patch: Partial<CatalogueFilter>) =>
    navigate({ search: toCatalogueSearch({ ...filter, ...patch }), replace: true })

  const all = catalogue.data ?? []
  const shown = filterCatalogue(all, filter, logbook)
  const faced = all.filter((phobia) => isFaced(logbook[phobia.slug])).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <p className="label-mono text-clinical">Archives — accès libre</p>
          <h1 className="font-display text-6xl font-black uppercase sm:text-7xl">Dossiers</h1>
        </div>
        <FacedCounter faced={faced} total={all.length} />
      </header>

      <Filters filter={filter} onChange={change} />

      {catalogue.isPending && <LoadingLine>Ouverture des archives…</LoadingLine>}
      {catalogue.isError && <LoadFailure onRetry={() => catalogue.refetch()} />}
      {catalogue.isSuccess && shown.length === 0 && (
        <p className="py-16 font-serif text-lg text-bone/70">
          Aucun dossier ne correspond. Les archives gardent leurs secrets.
        </p>
      )}

      <CaseFileGrid phobias={shown} className="pt-10" />
    </div>
  )
}

function FacedCounter({ faced, total }: { faced: number; total: number }) {
  return (
    <div className="flex min-w-64 flex-col gap-2">
      <p className="flex items-baseline justify-between gap-4">
        <span className="font-display text-4xl font-black">
          {faced} <span className="text-clinical">/ {total}</span>
        </span>
        <span className="label-mono text-clinical">affrontées</span>
      </p>
      <div className="h-1.5 bg-ash">
        <div
          className="h-full bg-rust-bright transition-[width] duration-700"
          style={{ width: total ? `${(faced / total) * 100}%` : '0%' }}
        />
      </div>
    </div>
  )
}

function Filters({
  filter,
  onChange,
}: {
  filter: CatalogueFilter
  onChange: (patch: Partial<CatalogueFilter>) => void
}) {
  const chip = (active: boolean) =>
    `border px-3 py-1.5 label-mono transition-colors ${
      active ? 'border-bone bg-bone text-ink' : 'border-ash text-bone/70 hover:border-bone/60 hover:text-bone'
    }`

  return (
    <div className="flex flex-col gap-4 border-y border-ash py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="flex flex-1 items-center gap-3 border-b border-bone/30 pb-1 focus-within:border-bone md:max-w-sm">
          <span className="label-mono text-clinical">Rechercher</span>
          <input
            type="search"
            value={filter.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="araignée, vide, clown…"
            className="w-full bg-transparent font-serif text-lg text-bone placeholder:text-bone/30 focus:outline-none"
          />
        </label>
        <fieldset className="flex gap-1.5">
          <legend className="sr-only">Statut</legend>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter.status === option.value}
              onClick={() => onChange({ status: option.value })}
              className={chip(filter.status === option.value)}
            >
              {option.label}
            </button>
          ))}
        </fieldset>
      </div>
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">Catégorie</legend>
        <button
          type="button"
          aria-pressed={filter.category === 'all'}
          onClick={() => onChange({ category: 'all' })}
          className={chip(filter.category === 'all')}
        >
          Toutes catégories
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.code}
            type="button"
            aria-pressed={filter.category === category.code}
            onClick={() => onChange({ category: category.code })}
            className={chip(filter.category === category.code)}
          >
            {category.label}
          </button>
        ))}
      </fieldset>
    </div>
  )
}
