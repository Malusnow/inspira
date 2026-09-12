import type { InsightDayCount } from "@inspira/contracts"
import { useMemo } from "react"

import { EChart } from "../../components/EChart"
import { buildEChartsTheme } from "../../lib/theme/echartsTheme"
import { useThemePreferences } from "../preferences/themePreferencesContext"
import { buildHeatmapOption } from "./heatmapOption"

/**
 * 53 weeks of 17px cells is the widest grid the window can produce (901px, plus
 * a hair of slack). The class stays literal so Tailwind can see it; the wrapper
 * scrolls below this width.
 */
const HEATMAP_WIDTH_CLASS = "min-w-[904px]"
const HEATMAP_HEIGHT = 148

export interface ActivityHeatmapProps {
  days: InsightDayCount[]
  /** Color ramp from "nothing saved" to "the most", shared with the legend. */
  levels: string[]
  maxCount: number
}

/**
 * One column per week, one square per day, tinted by how much was saved that
 * day. The panel owns the legend; the chart itself is a bare, non-interactive
 * grid.
 */
export function ActivityHeatmap({
  days,
  levels,
  maxCount
}: ActivityHeatmapProps) {
  const { resolvedThemeMode, colorScale, primaryColor } = useThemePreferences()
  const theme = buildEChartsTheme(resolvedThemeMode, colorScale)
  const option = useMemo(
    () => buildHeatmapOption(days, levels, maxCount),
    [days, levels, maxCount]
  )

  if (days.length === 0) {
    return null
  }

  return (
    <section className="rounded-xl bg-surface p-6">
      <div className="mb-4 flex items-center justify-end gap-1.5 text-[12px] text-ink-muted">
        <span>少</span>
        {levels.map((level, index) => (
          <span
            key={`${index}-${level}`}
            className="size-3 rounded-[3px]"
            style={{ background: level }}
          />
        ))}
        <span>多</span>
      </div>

      <div className="overflow-x-auto">
        <EChart
          option={option}
          theme={theme}
          themeKey={`${resolvedThemeMode}:${primaryColor}`}
          height={HEATMAP_HEIGHT}
          className={HEATMAP_WIDTH_CLASS}
          ariaLabel={`灵感分布热力图，单日最多 ${maxCount} 条`}
        />
      </div>
    </section>
  )
}
