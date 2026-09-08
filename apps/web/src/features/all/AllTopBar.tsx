import { SearchIcon } from "tdesign-icons-react"

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
    <>
      <header className="fixed left-0 right-[430px] top-0 z-20 hidden h-[84px] items-center bg-canvas px-8 lg:left-16 lg:flex">
        <label className="flex h-12 w-full max-w-[600px] items-center gap-3 rounded-2xl bg-surface-hover px-[18px] text-sm text-ink-muted">
          <SearchIcon className="size-[17px] shrink-0" />
          <input
            aria-label="Search notes"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search notes or tags..."
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink-strong outline-none placeholder:text-ink-muted"
          />
        </label>
      </header>

      <div className="px-5 pb-5 pt-[92px] sm:px-8 lg:px-10 lg:pt-[108px]">
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
          <label className="ml-3 flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface-hover px-3 text-sm text-ink-muted lg:hidden">
            <SearchIcon className="size-4 shrink-0" />
            <input
              aria-label="Search notes"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search notes or tags..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink-strong outline-none placeholder:text-ink-muted"
            />
          </label>
        </div>
      </div>
    </>
  )
}
