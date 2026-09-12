import {
  INSIGHTS_ACTIVE_WINDOW_DAYS,
  type InsightDayCount,
  type InsightsSummary,
  type InspirationType
} from "@inspira/contracts"

import { normalizeHex } from "../../lib/theme/colorScale"
import {
  buildSemanticTokens,
  type ResolvedThemeMode
} from "../../lib/theme/themeTokens"

const INSPIRATION_TYPE_LABELS: Record<InspirationType, string> = {
  page: "网页",
  image: "图片",
  quote: "引语",
  note: "笔记",
  video: "视频"
}

/**
 * Heatmap intensity is one color: the middle step of the primary scale at four
 * opacities. Both themes therefore mark the data the same way instead of
 * swapping in a second ramp.
 */
const HEATMAP_BASE_SCALE_INDEX = 5
const HEATMAP_LEVEL_OPACITIES = [0.32, 0.52, 0.74, 1] as const

/** Biggest type gets the deepest tint on light theme, the brightest on dark. */
const LIGHT_TYPE_BAR_SCALE_INDICES = [9, 7, 5, 2, 0] as const
const DARK_TYPE_BAR_SCALE_INDICES = [0, 2, 5, 7, 9] as const

export interface InsightsStatCard {
  id: "total" | "week" | "active"
  label: string
  value: number
  hint: string
}

export interface ContentTypeRow {
  type: InspirationType
  label: string
  count: number
  percent: number
  color: string
}

export interface InsightsViewModel {
  statCards: InsightsStatCard[]
  typeRows: ContentTypeRow[]
  tagRows: { tag: string; count: number }[]
  heatmapDays: InsightDayCount[]
  /** Color ramp from "nothing saved" to "the most", shared with the legend. */
  heatmapLevels: string[]
  heatmapMaxCount: number
  hasContent: boolean
}

export interface InsightsViewModelOptions {
  colorScale: readonly string[]
  resolvedThemeMode: ResolvedThemeMode
}

/**
 * Heatmap colors come from the shared scale so charts follow the user's primary
 * color instead of a hardcoded ramp. Only the first step is theme dependent: it
 * is the empty surface, which has to match the card behind it.
 */
export function buildHeatmapLevels(
  colorScale: readonly string[],
  resolvedThemeMode: ResolvedThemeMode
) {
  const semantic = buildSemanticTokens(resolvedThemeMode)
  const baseColor = normalizeHex(
    colorScale[HEATMAP_BASE_SCALE_INDEX] ?? semantic.inkMuted
  )

  return [
    semantic.surfaceHover,
    ...HEATMAP_LEVEL_OPACITIES.map((opacity) => withAlpha(baseColor, opacity))
  ]
}

/** `#RRGGBB` plus opacity in the `#RRGGBBAA` form ECharts and CSS both accept. */
function withAlpha(hex: string, opacity: number) {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")

  return `${hex}${alpha}`
}

function buildStatCards(summary: InsightsSummary): InsightsStatCard[] {
  return [
    {
      id: "total",
      label: "灵感总数",
      value: summary.totalCount,
      hint: `+${summary.createdThisMonth} 本月`
    },
    {
      id: "week",
      label: "本周新增",
      value: summary.createdThisWeek,
      hint: `+${summary.createdLastWeek} 上周`
    },
    {
      id: "active",
      label: "活跃天数",
      value: summary.activeDayCount,
      hint: `/ ${INSIGHTS_ACTIVE_WINDOW_DAYS} 天`
    }
  ]
}

/** Types the owner never saved are dropped: a row of zeros explains nothing. */
function buildTypeRows(
  summary: InsightsSummary,
  colorScale: readonly string[],
  resolvedThemeMode: ResolvedThemeMode
): ContentTypeRow[] {
  const total = summary.typeCounts.reduce((sum, item) => sum + item.count, 0)
  const scaleIndices =
    resolvedThemeMode === "dark"
      ? DARK_TYPE_BAR_SCALE_INDICES
      : LIGHT_TYPE_BAR_SCALE_INDICES
  const fallbackColor = buildSemanticTokens(resolvedThemeMode).inkMuted

  return summary.typeCounts
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count)
    .map((item, index) => ({
      type: item.type,
      label: INSPIRATION_TYPE_LABELS[item.type],
      count: item.count,
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
      color:
        colorScale[
          scaleIndices[index] ?? scaleIndices[scaleIndices.length - 1] ?? 0
        ] ?? fallbackColor
    }))
}

export function buildInsightsViewModel(
  summary: InsightsSummary,
  options: InsightsViewModelOptions
): InsightsViewModel {
  const heatmapMaxCount = summary.dailyCounts.reduce(
    (max, day) => Math.max(max, day.count),
    0
  )

  return {
    statCards: buildStatCards(summary),
    typeRows: buildTypeRows(
      summary,
      options.colorScale,
      options.resolvedThemeMode
    ),
    tagRows: summary.topTags,
    heatmapDays: summary.dailyCounts,
    heatmapLevels: buildHeatmapLevels(
      options.colorScale,
      options.resolvedThemeMode
    ),
    heatmapMaxCount,
    hasContent: summary.totalCount > 0
  }
}
