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
  renderCard
}: NoteMasonrySectionProps) {
  if (notes === undefined) {
    return <div className="min-h-[320px]" />
  }

  if (notes.length === 0) {
    return <>{emptyState}</>
  }

  return (
    <MasonryGrid
      items={notes}
      columnCount={columnCount}
      estimateHeight={estimateNoteCardHeight}
      getItemKey={getNoteKey}
      className={className}
      renderItem={renderCard}
    />
  )
}
