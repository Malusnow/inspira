export type AccountProps = {
  accountEmail: string
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
    </section>
  )
}
