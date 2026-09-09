import type { ColorScale10, HexColor } from "./colorScale"

export type ResolvedThemeMode = "light" | "dark"

export type ThemeVariables = Record<`--${string}`, string>

const stableLightTokens = {
  "--color-note-paper": "#ffffff",
  "--color-note-sage": "#eef4f1",
  "--color-note-warm": "#f2f4f7",
  "--color-note-blue": "#eef3f8",
  "--color-note-highlight": "#fff4a8",
  "--color-note-code": "#e2e7ef",
  "--color-danger": "#d5484f",
  "--color-danger-soft": "#ffeeee",
  "--color-success": "#2f9e6e",
  "--color-success-soft": "#e7f6ef",
  "--td-warning-color": "#be5a00",
  "--td-error-color": "#d54941",
  "--td-success-color": "#008858"
} satisfies ThemeVariables

const stableDarkTokens = {
  "--color-note-paper": "#303331",
  "--color-note-sage": "#293532",
  "--color-note-warm": "#35312d",
  "--color-note-blue": "#27343a",
  "--color-note-highlight": "#62582a",
  "--color-note-code": "#26313f",
  "--color-danger": "#ff8a8f",
  "--color-danger-soft": "#4a2a2c",
  "--color-success": "#4cc38d",
  "--color-success-soft": "#1f4032",
  "--td-warning-color": "#cf6e2d",
  "--td-error-color": "#c64751",
  "--td-success-color": "#43af8a"
} satisfies ThemeVariables

const SCALE_LAST_INDEX = 9

function clampScaleIndex(index: number) {
  return Math.min(SCALE_LAST_INDEX, Math.max(0, index))
}

function pickScaleStep(scale: ColorScale10, index: number) {
  return scale[clampScaleIndex(index)]
}

function pickStateStep(scale: ColorScale10, brandIndex: number, preferredIndex: number, fallbackIndex: number) {
  const preferred = clampScaleIndex(preferredIndex)

  return scale[preferred === brandIndex ? clampScaleIndex(fallbackIndex) : preferred]
}

function getReadableTextColor(hex: HexColor) {
  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)
  const toLinear = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue)

  return luminance > 0.46 ? "#111827" : "#ffffff"
}

function mixWithCanvas(color: HexColor, amount: number) {
  return `color-mix(in srgb, ${color} ${amount}%, var(--color-canvas))`
}

export function buildThemeVariables(
  primaryColor: HexColor,
  scale: ColorScale10,
  resolvedMode: ResolvedThemeMode
): ThemeVariables {
  const isDark = resolvedMode === "dark"
  const sourceIndex = scale.indexOf(primaryColor)
  const brandIndex = sourceIndex === -1 ? 5 : sourceIndex
  const brand = primaryColor
  const brandHover = isDark
    ? pickStateStep(scale, brandIndex, brandIndex - 1, brandIndex + 1)
    : pickStateStep(scale, brandIndex, brandIndex + 1, brandIndex - 1)
  const brandActive = isDark
    ? pickStateStep(scale, brandIndex, brandIndex - 2, brandIndex + 2)
    : pickStateStep(scale, brandIndex, brandIndex + 2, brandIndex - 2)
  const brandFocus = isDark ? mixWithCanvas(primaryColor, 42) : pickScaleStep(scale, brandIndex - 2)
  const brandSoft = isDark ? mixWithCanvas(primaryColor, 22) : pickScaleStep(scale, brandIndex - 4)
  const brandSoftHover = isDark ? mixWithCanvas(primaryColor, 32) : pickScaleStep(scale, brandIndex - 3)
  const brandLine = isDark ? mixWithCanvas(primaryColor, 48) : pickScaleStep(scale, brandIndex - 2)
  const brandMuted = isDark
    ? pickStateStep(scale, brandIndex, brandIndex - 1, brandIndex + 1)
    : pickStateStep(scale, brandIndex, brandIndex + 1, brandIndex - 1)
  const brandDisabled = isDark ? mixWithCanvas(primaryColor, 28) : pickScaleStep(scale, brandIndex - 3)
  const brandTextAnti = getReadableTextColor(primaryColor)
  const semanticTokens = isDark
    ? {
        "--color-canvas": "#171818",
        "--color-surface": "#242626",
        "--color-surface-hover": "#303331",
        "--color-raised": "#303331",
        "--color-ink-strong": "#eeeae3",
        "--color-ink": "#d4d0c9",
        "--color-ink-muted": "#aaa9a4",
        "--color-line": "#383b39",
        "--color-line-strong": "#464a47"
      }
    : {
        "--color-canvas": "#f5f6f8",
        "--color-surface": "#ffffff",
        "--color-surface-hover": "#eceff3",
        "--color-raised": "#ffffff",
        "--color-ink-strong": "#252b35",
        "--color-ink": "#4f5a69",
        "--color-ink-muted": "#748094",
        "--color-line": "#e3e7ed",
        "--color-line-strong": "#cfd6df"
      }

  const tdesignBrandScale = Object.fromEntries(
    scale.map((color, index) => [`--td-brand-color-${index + 1}`, color])
  ) as ThemeVariables

  return {
    ...semanticTokens,
    "--color-brand": brand,
    "--color-brand-hover": brandHover,
    "--color-brand-soft": brandSoft,
    "--color-brand-line": brandLine,
    "--color-brand-muted": brandMuted,
    "--td-brand-color": brand,
    "--td-brand-color-hover": brandHover,
    "--td-brand-color-active": brandActive,
    "--td-brand-color-focus": brandFocus,
    "--td-brand-color-disabled": brandDisabled,
    "--td-brand-color-light": brandSoft,
    "--td-brand-color-light-hover": brandSoftHover,
    "--td-text-color-brand": brand,
    "--td-text-color-link": brand,
    "--td-bg-color-page": "var(--color-canvas)",
    "--td-bg-color-container": "var(--color-surface)",
    "--td-bg-color-container-hover": "var(--color-surface-hover)",
    "--td-bg-color-container-active": "var(--color-raised)",
    "--td-bg-color-container-select": "var(--color-surface)",
    "--td-bg-color-secondarycontainer": "var(--color-surface-hover)",
    "--td-bg-color-secondarycontainer-hover": "var(--color-raised)",
    "--td-bg-color-secondarycontainer-active": "var(--color-line)",
    "--td-bg-color-component": "var(--color-line)",
    "--td-bg-color-component-hover": "var(--color-line-strong)",
    "--td-bg-color-component-active": "var(--color-line-strong)",
    "--td-bg-color-secondarycomponent": "var(--color-line)",
    "--td-bg-color-secondarycomponent-hover": "var(--color-line-strong)",
    "--td-bg-color-secondarycomponent-active": "var(--color-ink-muted)",
    "--td-bg-color-component-disabled": "var(--color-surface-hover)",
    "--td-bg-color-specialcomponent": isDark ? "transparent" : "var(--color-surface)",
    "--td-text-color-primary": "var(--color-ink-strong)",
    "--td-text-color-secondary": "var(--color-ink)",
    "--td-text-color-placeholder": "var(--color-ink-muted)",
    "--td-text-color-disabled": "var(--color-ink-muted)",
    "--td-text-color-anti": brandTextAnti,
    "--td-border-level-1-color": "var(--color-line)",
    "--td-component-stroke": "var(--color-line)",
    "--td-border-level-2-color": "var(--color-line-strong)",
    "--td-component-border": "var(--color-line-strong)",
    ...tdesignBrandScale,
    ...(isDark ? stableDarkTokens : stableLightTokens)
  }
}

export function applyThemeVariables(root: HTMLElement, variables: ThemeVariables) {
  Object.entries(variables).forEach(([name, value]) => {
    root.style.setProperty(name, value)
  })
}

export function isHexColor(value: string): value is HexColor {
  return /^#[\da-f]{6}$/.test(value)
}
