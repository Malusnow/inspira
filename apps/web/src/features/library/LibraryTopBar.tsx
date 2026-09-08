import { SearchIcon, ViewListIcon, ViewModuleIcon } from "tdesign-icons-react"
import type React from "react"

export type LibraryViewMode = "masonry" | "compact"

export interface LibraryTopBarProps {
  query: string
  viewMode: LibraryViewMode
  onQueryChange: (query: string) => void
  onViewModeChange: (viewMode: LibraryViewMode) => void
}

interface ViewButtonProps {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}

function ViewButton({ active, label, onClick, children }: ViewButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg border-0 bg-transparent text-ink-muted transition hover:bg-surface-hover hover:text-ink-strong aria-pressed:bg-surface-hover aria-pressed:text-ink-strong">
      {children}
    </button>
  )
}

export function LibraryTopBar({
  query,
  viewMode,
  onQueryChange,
  onViewModeChange
}: LibraryTopBarProps) {
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
        <div className="flex items-center gap-0.5">
          <ViewButton
            label="Masonry view"
            active={viewMode === "masonry"}
            onClick={() => onViewModeChange("masonry")}>
            <ViewModuleIcon />
          </ViewButton>
          <ViewButton
            label="Compact grid"
            active={viewMode === "compact"}
            onClick={() => onViewModeChange("compact")}>
            <ViewListIcon />
          </ViewButton>
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
