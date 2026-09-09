import { useUser } from "@clerk/react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { ChevronLeftIcon } from "tdesign-icons-react"

import { Account } from "./Account"
import { Appearance } from "./Appearance"
import { SettingsNav } from "./SettingsNav"
import { Toast, type ToastMessage } from "./Toast"

export function SettingsPage() {
  const { user } = useUser()
  const [copyToast, setCopyToast] = useState<ToastMessage | null>(null)
  const accountEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "未提供"

  useEffect(() => {
    if (!copyToast) return undefined

    const timeoutId = window.setTimeout(() => setCopyToast(null), 1800)

    return () => window.clearTimeout(timeoutId)
  }, [copyToast])

  return (
    <section className="min-h-svh px-5 py-7 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[980px]">
        <Link
          to="/all"
          className="mb-6 -ml-2 inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface-hover px-4 text-base font-medium text-ink-muted no-underline shadow-sm transition hover:border-brand-line hover:bg-brand-soft hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:-ml-4 lg:mb-10 lg:mt-6 lg:-ml-24">
          <ChevronLeftIcon className="size-4" />
          Back
        </Link>

        <header className="mb-9">
          <h1 className="m-0 font-serif text-[42px] font-normal italic leading-tight text-ink-strong">
            Settings
          </h1>
          <p className="m-0 mt-2 text-sm text-ink-muted">
            自定义你的 Inspira 体验。
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <SettingsNav />

          <div className="grid min-w-0 gap-4">
            <Appearance onCopyToast={setCopyToast} />
            <Account accountEmail={accountEmail} />
          </div>
        </div>
      </div>
      {copyToast && typeof document !== "undefined"
        ? createPortal(<Toast message={copyToast} />, document.body)
        : null}
    </section>
  )
}
