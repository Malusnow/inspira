import { useMemo } from "react"

import { StandalonePage } from "../../components/StandalonePage"
import { useThemePreferences } from "../preferences/themePreferencesContext"
import { ActivityHeatmap } from "./ActivityHeatmap"
import { ContentTypeBreakdown } from "./ContentTypeBreakdown"
import { InsightsStatCards } from "./InsightsStatCards"
import { buildInsightsViewModel } from "./insightsViewModel"
import { TopTagsList } from "./TopTagsList"
import { useInsightsSummary } from "./useInsightsSummary"

/**
 * Signed-in Insights surface. Every figure is derived from the owner's current
 * inspiration rows, so the numbers match what the All surface lists.
 */
export function InsightsPage() {
  const { summary, isLoading, isAuthenticated } = useInsightsSummary()
  const { colorScale, resolvedThemeMode } = useThemePreferences()
  const viewModel = useMemo(
    () =>
      summary
        ? buildInsightsViewModel(summary, { colorScale, resolvedThemeMode })
        : null,
    [summary, colorScale, resolvedThemeMode]
  )

  return (
    <StandalonePage title="Insights" subtitle="看看你的灵感空间在如何生长。">
      <div className="grid gap-4">
        {!isAuthenticated ? (
          <InsightsNotice text="登录后即可查看你的灵感统计。" />
        ) : isLoading || !viewModel ? (
          <InsightsLoadingState />
        ) : viewModel.hasContent ? (
          <>
            <InsightsStatCards cards={viewModel.statCards} />

            <ActivityHeatmap
              days={viewModel.heatmapDays}
              levels={viewModel.heatmapLevels}
              maxCount={viewModel.heatmapMaxCount}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl bg-surface p-6">
                <h2 className="mb-4 text-[15px] font-semibold text-ink-strong">
                  内容类型
                </h2>
                <ContentTypeBreakdown rows={viewModel.typeRows} />
              </section>
              <section className="rounded-xl bg-surface p-6">
                <h2 className="mb-4 text-[15px] font-semibold text-ink-strong">
                  最活跃的标签
                </h2>
                <TopTagsList rows={viewModel.tagRows} />
              </section>
            </div>
          </>
        ) : (
          <InsightsNotice text="还没有记录的灵感，快添加你的第一条灵感吧。" />
        )}
      </div>
    </StandalonePage>
  )
}

function InsightsNotice({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-surface p-6">
      <p className="text-[14px] text-ink-muted">{text}</p>
    </div>
  )
}

function InsightsLoadingState() {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-[112px] animate-pulse rounded-xl bg-surface"
          />
        ))}
      </div>
      <div className="h-[224px] animate-pulse rounded-xl bg-surface" />
    </div>
  )
}
