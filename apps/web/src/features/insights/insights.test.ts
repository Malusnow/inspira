import {
  buildInsightsSummary,
  getInsightsDateKey,
  getInsightsWeekStartDateKey,
  normalizeInsightsTimeZone,
  type InsightSourceItem
} from "@inspira/contracts"
import { describe, expect, it } from "vitest"

import { generateColorScale } from "../../lib/theme/colorScale"
import { buildSemanticTokens } from "../../lib/theme/themeTokens"
import { buildHeatmapLevels, buildInsightsViewModel } from "./insightsViewModel"

/** Friday, September 11 2026 12:00 UTC. */
const NOW = Date.UTC(2026, 8, 11, 12, 0, 0)
const COLOR_SCALE = generateColorScale("#6c63ff")

function createItem(
  isoDate: string,
  overrides: Partial<InsightSourceItem> = {}
): InsightSourceItem {
  return {
    createdAt: Date.parse(isoDate),
    type: "note",
    tags: [],
    ...overrides
  }
}

function getDayCount(
  dateKey: string,
  timeZone: string,
  items: InsightSourceItem[]
) {
  const summary = buildInsightsSummary(items, NOW, timeZone)

  return summary.dailyCounts.find((day) => day.date === dateKey)?.count
}

describe("insights time zone", () => {
  it("falls back to UTC when the zone is missing or unknown", () => {
    expect(normalizeInsightsTimeZone()).toBe("UTC")
    expect(normalizeInsightsTimeZone("   ")).toBe("UTC")
    expect(normalizeInsightsTimeZone("Not/AZone")).toBe("UTC")
    expect(normalizeInsightsTimeZone("Asia/Shanghai")).toBe("Asia/Shanghai")
  })

  it("buckets a timestamp into the local day of the requested zone", () => {
    const timestamp = Date.UTC(2026, 8, 10, 20, 0, 0)

    expect(getInsightsDateKey(timestamp, "UTC")).toBe("2026-09-10")
    expect(getInsightsDateKey(timestamp, "Asia/Shanghai")).toBe("2026-09-11")
  })

  it("starts the week on Monday", () => {
    expect(getInsightsWeekStartDateKey("2026-09-11")).toBe("2026-09-07")
    expect(getInsightsWeekStartDateKey("2026-09-07")).toBe("2026-09-07")
    expect(getInsightsWeekStartDateKey("2026-09-13")).toBe("2026-09-07")
  })
})

describe("buildInsightsSummary", () => {
  it("returns a zero filled window for an empty collection", () => {
    const summary = buildInsightsSummary([], NOW, "UTC")

    expect(summary.totalCount).toBe(0)
    expect(summary.createdThisWeek).toBe(0)
    expect(summary.activeDayCount).toBe(0)
    expect(summary.dailyCounts).toHaveLength(365)
    expect(summary.dailyCounts.every((day) => day.count === 0)).toBe(true)
    expect(summary.typeCounts).toHaveLength(5)
    expect(summary.typeCounts.every((item) => item.count === 0)).toBe(true)
    expect(summary.topTags).toEqual([])
  })

  it("moves a late-evening item to the next day in a positive-offset zone", () => {
    const items = [createItem("2026-09-10T20:00:00Z")]

    expect(getDayCount("2026-09-10", "UTC", items)).toBe(1)
    expect(getDayCount("2026-09-10", "Asia/Shanghai", items)).toBe(0)
    expect(getDayCount("2026-09-11", "Asia/Shanghai", items)).toBe(1)
  })

  it("counts the current and previous week separately", () => {
    const items = [
      createItem("2026-09-11T08:00:00Z"),
      createItem("2026-09-07T00:00:00Z"),
      createItem("2026-09-06T23:59:00Z"),
      createItem("2026-08-31T12:00:00Z")
    ]
    const summary = buildInsightsSummary(items, NOW, "UTC")

    expect(summary.createdThisWeek).toBe(2)
    expect(summary.createdLastWeek).toBe(2)
  })

  it("counts the current and previous month separately", () => {
    const items = [
      createItem("2026-09-11T08:00:00Z"),
      createItem("2026-09-06T23:59:00Z"),
      createItem("2026-08-31T12:00:00Z"),
      createItem("2026-08-15T12:00:00Z")
    ]
    const summary = buildInsightsSummary(items, NOW, "UTC")

    expect(summary.createdThisMonth).toBe(2)
    expect(summary.createdLastMonth).toBe(2)
  })

  it("counts each distinct tag once per content", () => {
    const items = [
      createItem("2026-09-11T08:00:00Z", { tags: ["design", "design", "ux"] }),
      createItem("2026-09-10T08:00:00Z", { tags: ["design"] }),
      createItem("2026-09-09T08:00:00Z", { tags: ["ux", "reading"] })
    ]
    const summary = buildInsightsSummary(items, NOW, "UTC")

    expect(summary.topTags).toEqual([
      { tag: "design", count: 2 },
      { tag: "ux", count: 2 },
      { tag: "reading", count: 1 }
    ])
  })

  it("caps the tag list and keeps the order stable", () => {
    const items = ["a", "b", "c", "d", "e", "f"].map((tag) =>
      createItem("2026-09-11T08:00:00Z", { tags: [tag] })
    )
    const summary = buildInsightsSummary(items, NOW, "UTC")

    expect(summary.topTags.map((item) => item.tag)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e"
    ])
  })

  it("counts every type in a fixed order", () => {
    const items = [
      createItem("2026-09-11T08:00:00Z", { type: "note" }),
      createItem("2026-09-10T08:00:00Z", { type: "image" }),
      createItem("2026-09-09T08:00:00Z", { type: "image" })
    ]
    const summary = buildInsightsSummary(items, NOW, "UTC")

    expect(summary.typeCounts).toEqual([
      { type: "page", count: 0 },
      { type: "image", count: 2 },
      { type: "quote", count: 0 },
      { type: "note", count: 1 },
      { type: "video", count: 0 }
    ])
  })

  it("only counts active days inside the recent window", () => {
    const outsideWindow = buildInsightsSummary(
      [createItem("2026-08-10T12:00:00Z")],
      NOW,
      "UTC"
    )
    const insideWindow = buildInsightsSummary(
      [
        createItem("2026-09-11T08:00:00Z"),
        createItem("2026-08-13T08:00:00Z"),
        createItem("2026-08-10T08:00:00Z")
      ],
      NOW,
      "UTC"
    )

    expect(outsideWindow.activeDayCount).toBe(0)
    expect(
      outsideWindow.dailyCounts.find((day) => day.date === "2026-08-10")?.count
    ).toBe(1)
    expect(insideWindow.activeDayCount).toBe(2)
  })

  it("keeps items older than the heatmap window in the totals", () => {
    const summary = buildInsightsSummary(
      [createItem("2024-01-01T12:00:00Z")],
      NOW,
      "UTC"
    )

    expect(summary.totalCount).toBe(1)
    expect(summary.dailyCounts.every((day) => day.count === 0)).toBe(true)
  })
})

describe("insights view model", () => {
  it("marks every heatmap level with the same primary color", () => {
    const lightLevels = buildHeatmapLevels(COLOR_SCALE, "light")
    const darkLevels = buildHeatmapLevels(COLOR_SCALE, "dark")

    // Only the empty step follows the theme; the data colors are identical.
    expect(lightLevels).toHaveLength(5)
    expect(lightLevels[0]).toBe(buildSemanticTokens("light").surfaceHover)
    expect(darkLevels[0]).toBe(buildSemanticTokens("dark").surfaceHover)
    expect(lightLevels.slice(1)).toEqual(darkLevels.slice(1))

    expect(lightLevels.slice(1).map((level) => level.slice(0, 7))).toEqual(
      Array.from({ length: 4 }, () => COLOR_SCALE[5])
    )

    const opacities = lightLevels
      .slice(1)
      .map((level) => Number.parseInt(level.slice(7), 16))

    expect(opacities).toEqual(
      [...opacities].sort((left, right) => left - right)
    )
    expect(opacities[0]).toBeGreaterThan(0)
  })

  it("builds stat cards, type rows and tag rows", () => {
    const items = [
      createItem("2026-09-11T08:00:00Z", { type: "image", tags: ["design"] }),
      createItem("2026-09-10T08:00:00Z", { type: "image" }),
      createItem("2026-09-09T08:00:00Z", { type: "note", tags: ["design"] })
    ]
    const summary = buildInsightsSummary(items, NOW, "UTC")
    const viewModel = buildInsightsViewModel(summary, {
      colorScale: COLOR_SCALE,
      resolvedThemeMode: "light"
    })

    expect(viewModel.hasContent).toBe(true)
    expect(viewModel.statCards).toEqual([
      { id: "total", label: "灵感总数", value: 3, hint: "+3 本月" },
      { id: "week", label: "本周新增", value: 3, hint: "+0 上周" },
      { id: "active", label: "活跃天数", value: 3, hint: "/ 30 天" }
    ])
    expect(viewModel.typeRows).toEqual([
      expect.objectContaining({
        type: "image",
        label: "图片",
        count: 2,
        percent: 67
      }),
      expect.objectContaining({
        type: "note",
        label: "笔记",
        count: 1,
        percent: 33
      })
    ])
    expect(viewModel.tagRows).toEqual([{ tag: "design", count: 2 }])
  })

  it("drops type rows the owner never used", () => {
    const viewModel = buildInsightsViewModel(
      buildInsightsSummary([], NOW, "UTC"),
      { colorScale: COLOR_SCALE, resolvedThemeMode: "dark" }
    )

    expect(viewModel.hasContent).toBe(false)
    expect(viewModel.typeRows).toEqual([])
    expect(viewModel.tagRows).toEqual([])
    expect(viewModel.heatmapDays).toHaveLength(365)
  })
})
