import type { InspirationItem } from "@inspira/contracts"
import type { ReactNode } from "react"

import { MasonryGrid } from "../../components/MasonryGrid"
import type { ResponsiveColumnCount } from "../../lib/layout/columns"
import { estimateNoteCardHeight } from "./noteMasonry"

export interface NoteMasonrySectionProps {
  /** undefined → still loading; an array → the loaded rows for the owner. */
  notes: InspirationItem[] | undefined
  /** Already-resolved column count, e.g. from `useResponsiveColumnCount`. */
  columnCount: ResponsiveColumnCount
  className?: string
  /** Rendered instead of the grid when there is nothing to show yet. */
  emptyState: ReactNode
  renderCard: (note: InspirationItem) => ReactNode
  canLoadMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

function getNoteKey(note: InspirationItem) {
  return note.id
}

/**
 * Loading / empty / grid switch shared by the All page and the workspace detail.
 * Both used to repeat the same skeleton height and masonry assembly, and any
 * drift between them showed up as a layout jump when switching surfaces.
 */
export function NoteMasonrySection({
  notes,
  columnCount,
  className,
  emptyState,
  renderCard,
  canLoadMore = false,
  isLoadingMore = false,
  onLoadMore
}: NoteMasonrySectionProps) {
  if (notes === undefined) {
    return <div className="min-h-[320px]" />
  }

  return (
    <>
      {notes.length === 0 ? (
        emptyState
      ) : (
        <MasonryGrid
          items={notes}
          columnCount={columnCount}
          estimateHeight={estimateNoteCardHeight}
          getItemKey={getNoteKey}
          className={className}
          renderItem={renderCard}
        />
      )}
      {canLoadMore || isLoadingMore ? (
        <div className="flex justify-center px-5 pb-16 pt-4">
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={onLoadMore}
            className="min-h-10 rounded-full border border-line bg-surface px-5 text-sm font-medium text-ink-muted transition hover:border-brand-line hover:bg-brand-soft hover:text-brand-ink-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-wait disabled:opacity-60">
            {isLoadingMore ? "加载中…" : "加载更多"}
          </button>
        </div>
      ) : null}
    </>
  )
}
