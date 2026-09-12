import { shiftInsightsDateKey, type InsightDayCount } from "@inspira/contracts"
import { init, use as registerEChartsModules } from "echarts/core"
import { SVGRenderer } from "echarts/renderers"
import { describe, expect, it } from "vitest"

import { generateColorScale } from "../../lib/theme/colorScale"
import { buildHeatmapLevels } from "./insightsViewModel"
import { buildHeatmapOption } from "./heatmapOption"

// The series and the calendar come from the option builder's own registration;
// the test only adds a renderer. Registering them here as well would hide a
// missing registerEChartsModules call, which renders nothing in the browser
// while still passing under test.
registerEChartsModules([SVGRenderer])

const TODAY = "2026-09-11"
/** Monday of the week the 365 day window opens in (2025-09-12 is a Friday). */
const GRID_START = "2025-09-08"
const WINDOW_START = "2025-09-12"
const WINDOW_DAYS = 365
/** Padded leading days plus the window: one cell per day of the grid. */
const CELL_COUNT = 369
/** 14px squares in 17px slots, matching the Insights prototype. */
const CELL_SIZE = 14

function createDays(): InsightDayCount[] {
  const days: InsightDayCount[] = []

  for (let offset = WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
    days.push({ date: shiftInsightsDateKey(TODAY, -offset), count: offset % 7 })
  }

  return days
}

function buildOption() {
  const levels = buildHeatmapLevels(generateColorScale("#6c63ff"), "light")

  return { levels, option: buildHeatmapOption(createDays(), levels, 6) }
}

function renderHeatmap() {
  const { levels, option } = buildOption()
  const chart = init(null, null, {
    renderer: "svg",
    ssr: true,
    width: 900,
    height: 200
  })

  chart.setOption(option)

  return { chart, levels }
}

/** Bounding box per `<path>`, one path per drawn day cell. */
function readCellBoxes(svg: string) {
  const boxes: { width: number; height: number }[] = []

  for (const [, path] of svg.matchAll(/\sd="([^"]+)"/g)) {
    const xs: number[] = []
    const ys: number[] = []

    for (const [, command, args] of path.matchAll(/([MLA])([^A-Za-z]*)/g)) {
      const numbers = args.trim().split(/[\s,]+/).map(Number)

      // `A rx ry angle large-arc sweep x y`, everything else is `x y`.
      xs.push(command === "A" ? numbers[5] : numbers[0])
      ys.push(command === "A" ? numbers[6] : numbers[1])
    }

    if (xs.length > 0) {
      boxes.push({
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys)
      })
    }
  }

  return boxes
}

describe("heatmap option", () => {
  it("renders a calendar heatmap through echarts", () => {
    const { chart } = renderHeatmap()

    try {
      const svg = chart.renderToSVGString()

      expect(svg.startsWith("<svg")).toBe(true)
      expect(svg).toContain("path")
    } finally {
      chart.dispose()
    }
  })

  it("opens the grid on a full week column", () => {
    const { chart } = renderHeatmap()

    try {
      const option = chart.getOption() as {
        calendar?: { range?: unknown }[]
        series?: { data?: unknown }[]
      }
      const range = option.calendar?.[0]?.range as string[]
      const data = option.series?.[0]?.data as [string, number][]

      expect(range).toEqual([GRID_START, TODAY])
      // Monday is the first row, so the range starts there even though the
      // window itself opens on a Friday.
      expect(new Date(`${range[0]}T00:00:00Z`).getUTCDay()).toBe(1)
      expect(shiftInsightsDateKey(range[0], 4)).toBe(WINDOW_START)
      expect(data).toHaveLength(CELL_COUNT)
      expect(data.slice(0, 5)).toEqual([
        ["2025-09-08", 0],
        ["2025-09-09", 0],
        ["2025-09-10", 0],
        ["2025-09-11", 0],
        ["2025-09-12", 0]
      ])
      expect(data[data.length - 1]).toEqual([TODAY, 0])
    } finally {
      chart.dispose()
    }
  })

  it("maps intensity through the shared color ramp", () => {
    const { chart, levels } = renderHeatmap()

    try {
      const option = chart.getOption() as {
        visualMap?: { inRange?: { color?: unknown } }[]
      }

      expect(option.visualMap?.[0]?.inRange?.color).toEqual(levels)
    } finally {
      chart.dispose()
    }
  })

  it("draws every day as a square", () => {
    const { chart } = renderHeatmap()

    try {
      // The calendar paints a transparent backdrop per day, so keep only the
      // boxes that actually carry size.
      const cells = readCellBoxes(chart.renderToSVGString()).filter(
        (box) => box.width > 0
      )

      expect(cells).toHaveLength(CELL_COUNT)
      for (const cell of cells) {
        expect(cell.width).toBeCloseTo(CELL_SIZE, 1)
        expect(cell.height).toBeCloseTo(CELL_SIZE, 1)
      }
    } finally {
      chart.dispose()
    }
  })

  it("rounds the day cells to match the legend", () => {
    const { chart } = renderHeatmap()

    try {
      const svg = chart.renderToSVGString()

      // Square cells only emit M/L/Z; rounded corners add arc commands.
      expect(svg).toMatch(/<path[^>]*d="[^"]*[aAcCqQ][^"]*"/)
    } finally {
      chart.dispose()
    }
  })

  it("reports the day count on hover without highlighting the cell", () => {
    const { option } = buildOption()
    const tooltip = option.tooltip as {
      formatter?: (params: { value: unknown }) => string
    }
    const series = option.series as { emphasis?: { disabled?: boolean } }[]

    expect(tooltip.formatter?.({ value: ["2026-09-11", 4] })).toBe("4 条灵感")
    // The tooltip is the only hover feedback: the cell itself stays flat.
    expect(series[0]?.emphasis?.disabled).toBe(true)
  })
})
