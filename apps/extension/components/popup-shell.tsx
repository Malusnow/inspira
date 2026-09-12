import { useId, type ReactNode } from "react"

import { COLORS, FONT_FAMILY, POPUP_WIDTH } from "~/components/theme"

/**
 * Brand mark variants from the prototype: the gradient diamond for saved
 * content, and the outlined diamond carrying a dot (signed out) or a cross
 * (could not save) for message states.
 */
export type BrandMarkVariant = "brand" | "plain" | "signin" | "failed"

const MARK_SIZE = 26

export function BrandMark({
  variant = "brand"
}: {
  variant?: BrandMarkVariant
}) {
  const gradientId = `inspira-mark-${useId().replace(/:/g, "")}`
  const diamond =
    variant === "brand"
      ? { fill: `url(#${gradientId})` }
      : {
          fill: "none",
          stroke: COLORS.accent,
          strokeOpacity: 0.45,
          strokeWidth: 1.8
        }

  return (
    <svg
      width={MARK_SIZE}
      height={MARK_SIZE}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ flexShrink: 0 }}>
      {variant === "brand" ? (
        <defs>
          <linearGradient
            id={gradientId}
            x1="6"
            y1="4"
            x2="28"
            y2="30"
            gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B7EF7" />
            <stop offset="1" stopColor="#6C63FF" />
          </linearGradient>
        </defs>
      ) : null}

      <rect
        x="7.5"
        y="7.5"
        width="17"
        height="17"
        rx="5"
        transform="rotate(45 16 16)"
        {...diamond}
      />

      {variant === "signin" ? (
        <circle
          cx="16"
          cy="16"
          r="2.4"
          fill={COLORS.accent}
          fillOpacity={0.55}
        />
      ) : null}

      {variant === "failed" ? (
        <path
          d="M12.5 12.5l7 7M19.5 12.5l-7 7"
          stroke={COLORS.accent}
          strokeOpacity={0.5}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  )
}

export function PopupStyles() {
  return (
    <style>{`
      @keyframes inspira-spin { to { transform: rotate(360deg); } }
      .inspira-field::placeholder { color: ${COLORS.placeholder}; }
      .inspira-field:focus { outline: none; }
    `}</style>
  )
}

export function PopupFrame({
  children,
  compact = false
}: {
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div
      style={{
        width: POPUP_WIDTH,
        boxSizing: "border-box",
        padding: "19px 22px 20px",
        background: "#FFFFFF",
        color: COLORS.text,
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        ...(compact
          ? { minHeight: 148, display: "flex", alignItems: "center" }
          : null)
      }}>
      <div style={{ width: "100%" }}>{children}</div>
    </div>
  )
}

export function Divider() {
  return (
    <div style={{ height: 1, background: COLORS.divider, margin: "0 -22px" }} />
  )
}
