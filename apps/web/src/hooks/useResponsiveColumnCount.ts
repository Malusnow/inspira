import { useEffect, useState } from "react"

import {
  resolveResponsiveColumnCount,
  type ResponsiveColumnCount
} from "../lib/layout/columns"

export type { ResponsiveColumnCount }

export function useResponsiveColumnCount(
  targetColumnCount: ResponsiveColumnCount
) {
  const [columnCount, setColumnCount] = useState<ResponsiveColumnCount>(() =>
    resolveResponsiveColumnCount(targetColumnCount)
  )

  useEffect(() => {
    function updateColumnCount() {
      setColumnCount(resolveResponsiveColumnCount(targetColumnCount))
    }

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)

    return () => window.removeEventListener("resize", updateColumnCount)
  }, [targetColumnCount])

  return columnCount
}
