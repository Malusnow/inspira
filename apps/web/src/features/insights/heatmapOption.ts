import {
  INSIGHTS_WEEK_START_DAY,
  getInsightsWeekStartDateKey,
  shiftInsightsDateKey,
  type InsightDayCount
} from "@inspira/contracts"
import type { EChartsOption } from "echarts"
import { HeatmapChart } from "echarts/charts"
import {
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent
} from "echarts/components"
import { use as registerEChartsModules } from "echarts/core"

// Series and components are registered next to the option builder they serve, so
// EChart only has to provide the renderer.
// Aliased import: eslint-plugin-react-hooks would otherwise read `use` as a hook.
registerEChartsModules([
  CalendarComponent,
  HeatmapChart,
  TooltipComponent,
  VisualMapComponent
])

/**
 * Matches the Insights prototype: 14px squares in 17px slots, the 3px gutter
 * coming from a transparent border. Cells are square because `"auto"` width
 * stretched them into rectangles.
 */
const CELL_SIZE = 17
const CELL_BORDER = 3
const CELL_RADIUS = 3
const CALENDAR_TOP = 24

/**
 * Builds the ECharts option for the 365 day calendar heatmap.
 *
 * ECharts lays calendar days out week by week, so a window that opens mid-week
 * leaves the first column ragged. The days between the window start and the
 * Monday before it are padded with zero counts, which keeps every column a full
 * week.
 *
 * ECharts refuses to render a heatmap without a `visualMap`, so intensity goes
 * through one. It stays hidden because the panel draws its own legend from the
 * same color ramp. Hovering a day reports how much was saved, but the cell
 * itself stays flat: no highlight, no zoom.
 */
export function buildHeatmapOption(
  days: readonly InsightDayCount[],
  levels: string[],
  maxCount: number
): EChartsOption {
  const series = padToWeekStart(days)
  const firstDate = series[0]?.date ?? ""
  const lastDate = series[series.length - 1]?.date ?? ""

  return {
    tooltip: {
      trigger: "item",
      // Keeps the bubble inside the chart, where the scroll container cannot
      // clip it.
      confine: true,
      formatter: (params) => {
        // Tooltip params are typed as a union of every series shape; a calendar
        // heatmap datum is always `[date, count]`.
        const [, count] = (params as unknown as { value: [string, number] })
          .value

        return `${count} 条灵感`
      }
    },
    visualMap: {
      type: "continuous",
      show: false,
      min: 0,
      max: Math.max(maxCount, 1),
      inRange: { color: levels }
    },
    calendar: {
      range: [firstDate, lastDate],
      left: "center",
      top: CALENDAR_TOP,
      cellSize: CELL_SIZE,
      splitLine: { show: false },
      itemStyle: {
        borderRadius: CELL_RADIUS,
        borderWidth: CELL_BORDER,
        borderColor: "transparent",
        color: "transparent"
      },
      dayLabel: { show: false, firstDay: INSIGHTS_WEEK_START_DAY },
      monthLabel: { fontSize: 10, margin: 6 },
      yearLabel: { show: false }
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        // Same border as the calendar cells, so filled and empty days match.
        itemStyle: {
          borderRadius: CELL_RADIUS,
          borderWidth: CELL_BORDER,
          borderColor: "transparent"
        },
        emphasis: { disabled: true },
        data: series.map((day) => [day.date, day.count])
      }
    ]
  }
}

/** Backfills the days between the first week's Monday and the window start. */
function padToWeekStart(days: readonly InsightDayCount[]): InsightDayCount[] {
  const first = days[0]

  if (!first) {
    return []
  }

  const padded: InsightDayCount[] = []

  for (
    let date = getInsightsWeekStartDateKey(first.date);
    date < first.date;
    date = shiftInsightsDateKey(date, 1)
  ) {
    padded.push({ date, count: 0 })
  }

  return [...padded, ...days]
}
