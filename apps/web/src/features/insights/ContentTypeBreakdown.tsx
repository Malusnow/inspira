import type { ContentTypeRow } from "./insightsViewModel"

export interface ContentTypeBreakdownProps {
  rows: ContentTypeRow[]
}

export function ContentTypeBreakdown({ rows }: ContentTypeBreakdownProps) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-ink-muted">还没有可统计的内容。</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.type} className="flex items-center gap-3">
          <span className="min-w-[50px] text-[13px] text-ink-muted">
            {row.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${row.percent}%`, background: row.color }}
            />
          </div>
          <span className="min-w-[36px] text-right text-[13px] font-medium text-ink-strong">
            {row.percent}%
          </span>
        </div>
      ))}
    </div>
  )
}
