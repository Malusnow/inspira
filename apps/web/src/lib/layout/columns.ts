/** Single source of truth for masonry column counts and their grid classes. */
export type ResponsiveColumnCount = 1 | 2 | 3 | 4 | 5

export const columnClasses: Record<ResponsiveColumnCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5"
}

/** Clamps the requested column count to what the current viewport can hold. */
export function resolveResponsiveColumnCount(
  targetColumnCount: ResponsiveColumnCount
): ResponsiveColumnCount {
  if (typeof window === "undefined") return 1

  const width = window.innerWidth

  if (width < 640) return 1
  if (width < 900) return Math.min(2, targetColumnCount) as ResponsiveColumnCount
  if (width < 1120) return Math.min(3, targetColumnCount) as ResponsiveColumnCount

  return targetColumnCount
}
