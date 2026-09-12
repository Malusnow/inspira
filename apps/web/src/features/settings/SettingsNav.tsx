const settingsNavItems = [
  { label: "外观", href: "#settings-appearance", active: true },
  { label: "账户", href: "#settings-account", active: false }
] as const

export function SettingsNav() {
  return (
    <nav
      className="flex gap-2 lg:sticky lg:top-20 lg:block lg:self-start"
      aria-label="Settings sections">
      {settingsNavItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className={`inline-flex min-h-9 items-center rounded-lg px-3.5 text-sm no-underline transition lg:mb-1 lg:flex ${
            item.active
              ? "bg-brand-soft font-medium text-brand-ink"
              : "text-ink-muted hover:bg-surface-hover hover:text-ink-strong"
          }`}>
          {item.label}
        </a>
      ))}
    </nav>
  )
}
