import { useUser } from "@clerk/react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { StandalonePage } from "../../components/StandalonePage"
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
    <StandalonePage title="Settings" subtitle="自定义你的 Inspira 体验。">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <SettingsNav />

        <div className="grid min-w-0 gap-4">
          <Appearance onCopyToast={setCopyToast} />
          <Account accountEmail={accountEmail} />
        </div>
      </div>
      {copyToast && typeof document !== "undefined"
        ? createPortal(<Toast message={copyToast} />, document.body)
        : null}
    </StandalonePage>
  )
}
