import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { catalogueQuery } from '../api/client'
import { CaseFileGrid } from '../catalogue/CaseFileGrid'
import { CATEGORY_CODES } from '../catalogue/categories'
import {
  type CatalogueFilter,
  filterCatalogue,
  parseCatalogueSearch,
  toCatalogueSearch,
} from '../catalogue/filter'
import { useLang, useT } from '../i18n/context'
import { isFaced } from '../logbook/logbook'
import { useLogbook } from '../logbook/store'
import { LoadFailure, LoadingLine } from '../ui/LoadState'

const STATUSES = ['all', 'faced', 'todo'] as const

export function CataloguePage() {
  const t = useT()
  const filter = parseCatalogueSearch(useSearch({ from: '/$lang/dossiers' }))
  const navigate = useNavigate({ from: '/$lang/dossiers' })
  const logbook = useLogbook()
  const catalogue = useQuery(catalogueQuery(useLang()))

  const change = (patch: Partial<CatalogueFilter>) =>
    navigate({ search: toCatalogueSearch({ ...filter, ...patch }), replace: true })

  const all = catalogue.data ?? []
  const shown = filterCatalogue(all, filter, logbook)
  const faced = all.filter((phobia) => isFaced(logbook[phobia.slug])).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <p className="label-mono text-clinical">{t.catalogue.kicker}</p>
          <h1 className="font-display text-6xl font-black break-words uppercase sm:text-7xl">
            {t.catalogue.title}
          </h1>
        </div>
        <FacedCounter faced={faced} total={all.length} />
      </header>

      <Filters filter={filter} onChange={change} />

      {catalogue.isPending && <LoadingLine>{t.catalogue.loading}</LoadingLine>}
      {catalogue.isError && <LoadFailure onRetry={() => catalogue.refetch()} />}
      {catalogue.isSuccess && shown.length === 0 && (
        <p className="py-16 font-serif text-lg text-bone/70">{t.catalogue.empty}</p>
      )}

      <CaseFileGrid phobias={shown} className="pt-10" />
    </div>
  )
}

function FacedCounter({ faced, total }: { faced: number; total: number }) {
  const t = useT()
  return (
    <div className="flex min-w-64 flex-col gap-2">
      <p className="flex items-baseline justify-between gap-4">
        <span className="font-display text-4xl font-black">
          {faced} <span className="text-clinical">/ {total}</span>
        </span>
        <span className="label-mono text-clinical">{t.catalogue.faced}</span>
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
  const t = useT()
  const chip = (active: boolean) =>
    `border px-3 py-1.5 label-mono transition-colors ${
      active ? 'border-bone bg-bone text-ink' : 'border-ash text-bone/70 hover:border-bone/60 hover:text-bone'
    }`

  return (
    <div className="flex flex-col gap-4 border-y border-ash py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="flex flex-1 items-center gap-3 border-b border-bone/30 pb-1 focus-within:border-bone md:max-w-sm">
          <span className="label-mono text-clinical">{t.catalogue.search}</span>
          <input
            type="search"
            value={filter.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder={t.catalogue.searchPlaceholder}
            className="w-full bg-transparent font-serif text-lg text-bone placeholder:text-bone/30 focus:outline-none"
          />
        </label>
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="sr-only">{t.catalogue.statusLegend}</legend>
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={filter.status === status}
              onClick={() => onChange({ status })}
              className={chip(filter.status === status)}
            >
              {t.catalogue.status[status]}
            </button>
          ))}
        </fieldset>
      </div>
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">{t.catalogue.categoryLegend}</legend>
        <button
          type="button"
          aria-pressed={filter.category === 'all'}
          onClick={() => onChange({ category: 'all' })}
          className={chip(filter.category === 'all')}
        >
          {t.catalogue.allCategories}
        </button>
        {CATEGORY_CODES.map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={filter.category === code}
            onClick={() => onChange({ category: code })}
            className={chip(filter.category === code)}
          >
            {t.categories[code]}
          </button>
        ))}
      </fieldset>
    </div>
  )
}
