import { Fragment, useMemo, type ReactNode } from "react"

import {
  columnClasses,
  type ResponsiveColumnCount
} from "../lib/layout/columns"
import {
  distributeIntoMasonryColumns,
  MASONRY_GAP_CLASS
} from "../lib/layout/masonry"

export interface MasonryGridProps<T> {
  items: T[]
  /** Already-resolved column count, e.g. from `useResponsiveColumnCount`. */
  columnCount: ResponsiveColumnCount
  estimateHeight: (item: T) => number
  getItemKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  className?: string
}

/**
 * Shared masonry renderer used by both the All page and the workspace detail
 * view, so the column distribution algorithm has exactly one implementation.
 */
export function MasonryGrid<T>({
  items,
  columnCount,
  estimateHeight,
  getItemKey,
  renderItem,
  className
}: MasonryGridProps<T>) {
  const columns = useMemo(
    () => distributeIntoMasonryColumns(items, columnCount, estimateHeight),
    [columnCount, estimateHeight, items]
  )

  return (
    <div
      className={`grid items-start ${MASONRY_GAP_CLASS} ${columnClasses[columnCount]} ${className ?? ""}`}>
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className={`flex min-w-0 flex-col ${MASONRY_GAP_CLASS}`}>
          {column.items.map((item) => (
            <Fragment key={getItemKey(item)}>{renderItem(item)}</Fragment>
          ))}
        </div>
      ))}
    </div>
  )
}
