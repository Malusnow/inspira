import { describe, expect, it } from "vitest"

import { generateColorScale, type HexColor } from "./colorScale"
import { buildEChartsTheme } from "./echartsTheme"
import { buildSemanticTokens } from "./themeTokens"

const PRIMARY_COLOR = "#6c63ff" satisfies HexColor

describe("echarts theme", () => {
  it("derives the series palette from the shared color scale", () => {
    const scale = generateColorScale(PRIMARY_COLOR)

    const lightTheme = buildEChartsTheme("light", scale)
    const darkTheme = buildEChartsTheme("dark", scale)

    // The scale runs light -> dark: the light theme must lead with the readable
    // dark end, and the dark theme with the light end.
    expect(lightTheme.color).toEqual([...scale].reverse())
    expect(darkTheme.color).toEqual([...scale])
  })

  it("reuses the semantic tokens for surfaces, text and axes", () => {
    const scale = generateColorScale(PRIMARY_COLOR)

    ;(["light", "dark"] as const).forEach((mode) => {
      const semantic = buildSemanticTokens(mode)
      const theme = buildEChartsTheme(mode, scale)

      expect(theme.backgroundColor).toBe(semantic.surface)
      expect(theme.textStyle.color).toBe(semantic.ink)
      expect(theme.title.textStyle.color).toBe(semantic.inkStrong)
      expect(theme.legend.textStyle.color).toBe(semantic.ink)
      expect(theme.categoryAxis.axisLine.lineStyle.color).toBe(semantic.line)
      expect(theme.categoryAxis.axisLabel.color).toBe(semantic.inkMuted)
      expect(theme.valueAxis.splitLine.lineStyle.color).toBe(semantic.line)
      expect(theme.valueAxis.axisLabel.color).toBe(semantic.inkMuted)
    })
  })

  it("keeps the chart frame quiet so data stays the focus", () => {
    const scale = generateColorScale(PRIMARY_COLOR)

    ;(["light", "dark"] as const).forEach((mode) => {
      const theme = buildEChartsTheme(mode, scale)

      expect(theme.categoryAxis.splitLine.show).toBe(false)
      expect(theme.valueAxis.axisLine.show).toBe(false)
      expect(theme.valueAxis.axisTick.show).toBe(false)
      expect(theme.categoryAxis.axisLine.show).toBe(true)
    })
  })

  it("keeps the tooltip readable against the page surface in both themes", () => {
    const scale = generateColorScale(PRIMARY_COLOR)

    ;(["light", "dark"] as const).forEach((mode) => {
      const theme = buildEChartsTheme(mode, scale)

      expect(theme.tooltip.backgroundColor).not.toBe(theme.backgroundColor)
      expect(theme.tooltip.textStyle.color).not.toBe(theme.tooltip.backgroundColor)
    })

    expect(buildEChartsTheme("light", scale).tooltip.borderWidth).toBe(0)
    expect(buildEChartsTheme("dark", scale).tooltip.borderWidth).toBe(1)
  })

  it("keeps every palette entry on the shared scale for custom primaries", () => {
    const scale = generateColorScale("#2f9e6e" satisfies HexColor)
    const theme = buildEChartsTheme("light", scale)

    expect(theme.color).toHaveLength(10)
    theme.color.forEach((color) => {
      expect(scale).toContain(color)
    })
  })
})
