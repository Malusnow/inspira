import { SearchField } from "../../components/SearchField"

export type AllColumnCount = 4 | 5

export interface AllTopBarProps {
  query: string
  columnCount: AllColumnCount
  onQueryChange: (query: string) => void
  onColumnCountChange: (columnCount: AllColumnCount) => void
}

interface DensityButtonProps {
  active: boolean
  columnCount: AllColumnCount
  onClick: () => void
}

function DensityButton({ active, columnCount, onClick }: DensityButtonProps) {
  const iconSize = columnCount === 4 ? 5 : 3
  const iconCount = columnCount === 4 ? 4 : 9

  return (
    <button
      type="button"
      title={`${columnCount} columns`}
      aria-label={`${columnCount} columns`}
      aria-pressed={active}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-xl border-0 bg-transparent text-ink-muted/45 transition hover:bg-surface-hover hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-pressed:bg-surface-hover aria-pressed:text-ink-strong aria-pressed:shadow-sm">
      <span
        aria-hidden="true"
        className="grid size-[21px] place-content-center"
        style={{
          gap: columnCount === 4 ? 4 : 2.5,
          gridTemplateColumns: `repeat(${columnCount === 4 ? 2 : 3}, ${iconSize}px)`
        }}>
        {Array.from({ length: iconCount }).map((_, index) => (
          <span
            key={index}
            className="rounded-[1.5px] bg-current"
            style={{ width: iconSize, height: iconSize }}
          />
        ))}
      </span>
    </button>
  )
}

export function AllTopBar({
  query,
  columnCount,
  onQueryChange,
  onColumnCountChange
}: AllTopBarProps) {
  return (
    <div className="px-5 pb-5 pt-4 sm:px-8 lg:px-10 lg:pt-6">
      <div className="flex items-center">
        <div className="flex items-center gap-1 rounded-2xl bg-surface/90 p-1 shadow-[0_8px_24px_rgb(37_43_53_/_0.06)]">
          <DensityButton
            active={columnCount === 4}
            columnCount={4}
            onClick={() => onColumnCountChange(4)}
          />
          <DensityButton
            active={columnCount === 5}
            columnCount={5}
            onClick={() => onColumnCountChange(5)}
          />
        </div>
        <SearchField
          value={query}
          onChange={onQueryChange}
          className="ml-3 flex h-10 min-w-0 flex-1 gap-2 rounded-xl bg-surface-hover px-3 text-sm lg:hidden"
          iconClassName="size-4"
          inputClassName="text-sm text-ink-strong"
        />
      </div>
    </div>
  )
}
