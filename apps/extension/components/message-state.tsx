import type { ReactNode } from "react"

import {
  BrandMark,
  PopupFrame,
  type BrandMarkVariant
} from "~/components/popup-shell"
import { COLORS, FONT_FAMILY } from "~/components/theme"
import { openTab } from "~/lib/browser"

/** The prototype's message layout: mark, title, copy and an optional action. */
export function MessageState({
  mark,
  title,
  description,
  action
}: {
  mark: BrandMarkVariant
  title: string
  description: ReactNode
  action?: ReactNode
}) {
  return (
    <PopupFrame compact>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <BrandMark variant={mark} />
        <div style={{ paddingTop: 1 }}>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: "-0.2px",
              marginBottom: 5
            }}>
            {title}
          </div>
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.65,
              color: COLORS.secondary
            }}>
            {description}
          </div>
          {action ? <div style={{ marginTop: 13 }}>{action}</div> : null}
        </div>
      </div>
    </PopupFrame>
  )
}

export function SavingState() {
  return (
    <PopupFrame compact>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 19,
            height: 19,
            borderRadius: "50%",
            border: "1.8px solid rgba(108, 99, 255, 0.18)",
            borderTopColor: COLORS.accent,
            animation: "inspira-spin 0.7s linear infinite"
          }}
        />
        <span style={{ fontSize: 15.5, fontWeight: 500, color: COLORS.secondary }}>
          正在保存…
        </span>
      </div>
    </PopupFrame>
  )
}

export function LoginLink({ landingUrl }: { landingUrl: string }) {
  return (
    <a
      href={landingUrl}
      onClick={(event) => {
        event.preventDefault()
        void openTab(landingUrl)
      }}
      style={{
        color: COLORS.accent,
        textDecoration: "underline",
        textUnderlineOffset: 2,
        cursor: "pointer"
      }}>
      登录
    </a>
  )
}

export function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 9,
        fontFamily: FONT_FAMILY,
        fontSize: 13.5,
        fontWeight: 500,
        padding: "9px 18px",
        cursor: "pointer",
        background: COLORS.accent,
        color: "#FFFFFF"
      }}>
      重试
    </button>
  )
}
