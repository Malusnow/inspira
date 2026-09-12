import type { ColorScale10 } from "./colorScale"
import { buildSemanticTokens, type ResolvedThemeMode } from "./themeTokens"

/**
 * ECharts theme object. Kept structural (no ECharts internal type import) so the
 * shape stays under our control while remaining assignable to `echarts.init`.
 */
export interface EChartsTheme {
  color: string[]
  backgroundColor: string
  textStyle: { color: string }
  title: { textStyle: { color: string } }
  legend: { textStyle: { color: string } }
  tooltip: {
    backgroundColor: string
    borderColor: string
    borderWidth: number
    textStyle: { color: string }
  }
  categoryAxis: EChartsAxisTheme
  valueAxis: EChartsAxisTheme
}

interface EChartsAxisTheme {
  axisLine: { show: boolean; lineStyle: { color: string } }
  axisTick: { show: boolean; lineStyle: { color: string } }
  axisLabel: { show: boolean; color: string }
  splitLine: { show: boolean; lineStyle: { color: string } }
  splitArea: { show: boolean }
}

/**
 * Tooltip is a floating layer, so it uses the inverted pair instead of the page
 * surface: dark bubble on the light theme, raised surface on the dark theme.
 */
const LIGHT_TOOLTIP_TOKENS = { backgroundColor: "#20201e", color: "#ffffff" } as const
const DARK_TOOLTIP_TOKENS = { backgroundColor: "#303331", color: "#eeeae3" } as const

/**
 * Builds an ECharts theme from the same source as the CSS/TDesign tokens
 * (`colorScale` + semantic neutrals), so charts retheme with the app instead of
 * hardcoding brand hex in chart options.
 */
export function buildEChartsTheme(resolvedMode: ResolvedThemeMode, scale: ColorScale10): EChartsTheme {
  const isDark = resolvedMode === "dark"
  const semantic = buildSemanticTokens(resolvedMode)
  const tooltipTokens = isDark ? DARK_TOOLTIP_TOKENS : LIGHT_TOOLTIP_TOKENS

  // The scale runs light -> dark. Series colors must stay readable on the page
  // surface, so pick the dark end first on light theme and the light end first
  // on dark theme.
  const palette = isDark ? [...scale] : [...scale].reverse()

  return {
    color: palette,
    backgroundColor: semantic.surface,
    textStyle: { color: semantic.ink },
    title: { textStyle: { color: semantic.inkStrong } },
    legend: { textStyle: { color: semantic.ink } },
    tooltip: {
      backgroundColor: tooltipTokens.backgroundColor,
      borderColor: isDark ? semantic.lineStrong : "transparent",
      borderWidth: isDark ? 1 : 0,
      textStyle: { color: tooltipTokens.color }
    },
    categoryAxis: createAxisTheme({
      showAxisLine: true,
      showTick: true,
      showSplitLine: false,
      axisColor: semantic.line,
      labelColor: semantic.inkMuted,
      splitLineColor: semantic.line
    }),
    valueAxis: createAxisTheme({
      showAxisLine: false,
      showTick: false,
      showSplitLine: true,
      axisColor: semantic.line,
      labelColor: semantic.inkMuted,
      splitLineColor: semantic.line
    })
  }
}

interface AxisThemeOptions {
  showAxisLine: boolean
  showTick: boolean
  showSplitLine: boolean
  axisColor: string
  labelColor: string
  splitLineColor: string
}

function createAxisTheme(options: AxisThemeOptions): EChartsAxisTheme {
  return {
    axisLine: { show: options.showAxisLine, lineStyle: { color: options.axisColor } },
    axisTick: { show: options.showTick, lineStyle: { color: options.axisColor } },
    axisLabel: { show: true, color: options.labelColor },
    splitLine: { show: options.showSplitLine, lineStyle: { color: options.splitLineColor } },
    splitArea: { show: false }
  }
}
