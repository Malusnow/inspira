export type AccountProps = {
  accountEmail: string
}

function getPluginStatusText() {
  return "未检测"
}

export function Account({ accountEmail }: AccountProps) {
  return (
    <section id="settings-account" className="rounded-xl bg-surface p-5 sm:p-6">
      <h2 className="m-0 mb-5 text-[15px] font-semibold text-ink-strong">
        账户
      </h2>
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-line py-2">
        <span className="text-sm text-ink-strong">邮箱</span>
        <span className="break-all text-sm text-ink-muted">{accountEmail}</span>
      </div>
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 py-2">
        <span className="text-sm text-ink-strong">浏览器插件</span>
        <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
          <span className="size-2 rounded-full bg-line-strong" />
          {getPluginStatusText()}
        </span>
      </div>
    </section>
  )
}
