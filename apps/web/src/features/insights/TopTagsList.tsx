export interface TopTagsListProps {
  rows: { tag: string; count: number }[]
}

export function TopTagsList({ rows }: TopTagsListProps) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-ink-muted">还没有使用过标签。</p>
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row, index) => (
        <div
          key={row.tag}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover">
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-surface-hover text-[11px] font-semibold text-ink-muted">
            {index + 1}
          </span>
          <span className="flex-1 truncate text-[13.5px] text-ink">
            # {row.tag}
          </span>
          <span className="shrink-0 text-[13px] text-ink-muted">
            {row.count} 条
          </span>
        </div>
      ))}
    </div>
  )
}
