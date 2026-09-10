export interface MasonryColumn<T> {
  height: number
  items: T[]
}

/**
 * Vertical gap between cards, in px. Must stay in sync with `MASONRY_GAP_CLASS`
 * (Tailwind `gap-5`) below — both live here so the estimator and the layout can
 * never drift apart silently.
 */
export const MASONRY_GAP_PX = 20
export const MASONRY_GAP_CLASS = "gap-5"

export function distributeIntoMasonryColumns<T>(
  items: T[],
  columnCount: number,
  estimateHeight: (item: T) => number,
  gap = MASONRY_GAP_PX
): MasonryColumn<T>[] {
  const safeColumnCount = Math.max(1, Math.floor(columnCount))
  const columns = Array.from({ length: safeColumnCount }, () => ({
    height: 0,
    items: [] as T[]
  }))

  for (const item of items) {
    const shortestColumn = columns.reduce((shortest, column) =>
      column.height < shortest.height ? column : shortest
    )

    shortestColumn.items.push(item)
    shortestColumn.height += estimateHeight(item) + gap
  }

  return columns
}
