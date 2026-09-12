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

export interface SemanticTokens {
  canvas: string
  surface: string
  surfaceHover: string
  raised: string
  inkStrong: string
  ink: string
  inkMuted: string
  line: string
  lineStrong: string
}

const LIGHT_SEMANTIC_TOKENS = {
  canvas: "#f5f6f8",
  surface: "#ffffff",
  surfaceHover: "#eceff3",
  raised: "#ffffff",
  inkStrong: "#252b35",
  ink: "#4f5a69",
  inkMuted: "#748094",
  line: "#e3e7ed",
  lineStrong: "#cfd6df"
} satisfies SemanticTokens

const DARK_SEMANTIC_TOKENS = {
  canvas: "#171818",
  surface: "#242626",
  surfaceHover: "#303331",
  raised: "#303331",
  inkStrong: "#eeeae3",
  ink: "#d4d0c9",
  inkMuted: "#aaa9a4",
  line: "#383b39",
  lineStrong: "#464a47"
} satisfies SemanticTokens

export function buildSemanticTokens(resolvedMode: ResolvedThemeMode): SemanticTokens {
  return resolvedMode === "dark" ? DARK_SEMANTIC_TOKENS : LIGHT_SEMANTIC_TOKENS
}

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

function toLinearChannel(channel: number) {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)

  return 0.2126 * toLinearChannel(red) + 0.7152 * toLinearChannel(green) + 0.0722 * toLinearChannel(blue)
}

export function contrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  const lightest = Math.max(firstLuminance, secondLuminance)
  const darkest = Math.min(firstLuminance, secondLuminance)

  return (lightest + 0.05) / (darkest + 0.05)
}

function mixHex(from: string, to: string, amount: number): HexColor {
  const ratio = Math.min(1, Math.max(0, amount))
  const fromRgb = [1, 3, 5].map((offset) => Number.parseInt(from.slice(offset, offset + 2), 16))
  const toRgb = [1, 3, 5].map((offset) => Number.parseInt(to.slice(offset, offset + 2), 16))
  const channel = (start: number, end: number) =>
    Math.round(start + (end - start) * ratio)
      .toString(16)
      .padStart(2, "0")

  return `#${channel(fromRgb[0], toRgb[0])}${channel(fromRgb[1], toRgb[1])}${channel(fromRgb[2], toRgb[2])}`
}

function getReadableTextColor(hex: HexColor) {
  return relativeLuminance(hex) > 0.46 ? "#111827" : "#ffffff"
}

/* WCAG AA for normal text. Brand-colored copy must clear this against the mode surface. */
const BRAND_TEXT_CONTRAST = 4.5
/* Extra mix toward the mode ink so hover states still read as a state change. */
const BRAND_TEXT_HOVER_SHIFT = 0.14
const BRAND_INK_SEARCH_STEPS = 16

/**
 * 主色不能同时充当填充与文字色：过浅的主色在浅色表面、过深的主色在深色表面上都会让文字失去对比度。
 * 这里以当前模式的表面色为基准，只在必要时把主色朝该模式的墨色混合，
 * 得到刚好满足对比度阈值的「文字主色」，填充色仍保持原始主色。
 */
function buildBrandTextInk(brand: HexColor, semantic: SemanticTokens) {
  const surface = semantic.surface
  const ink = semantic.inkStrong

  if (contrastRatio(brand, surface) >= BRAND_TEXT_CONTRAST) {
    return {
      ink: brand,
      inkHover: mixHex(brand, ink, BRAND_TEXT_HOVER_SHIFT)
    }
  }

  let lower = 0
  let upper = 1

  for (let step = 0; step < BRAND_INK_SEARCH_STEPS; step += 1) {
    const middle = (lower + upper) / 2

    if (contrastRatio(mixHex(brand, ink, middle), surface) >= BRAND_TEXT_CONTRAST) {
      upper = middle
    } else {
      lower = middle
    }
  }

  return {
    ink: mixHex(brand, ink, upper),
    inkHover: mixHex(brand, ink, Math.min(1, upper + BRAND_TEXT_HOVER_SHIFT))
  }
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
  const semantic = buildSemanticTokens(resolvedMode)
  const brandText = buildBrandTextInk(primaryColor, semantic)
  const semanticTokens: ThemeVariables = {
    "--color-canvas": semantic.canvas,
    "--color-surface": semantic.surface,
    "--color-surface-hover": semantic.surfaceHover,
    "--color-raised": semantic.raised,
    "--color-ink-strong": semantic.inkStrong,
    "--color-ink": semantic.ink,
    "--color-ink-muted": semantic.inkMuted,
    "--color-line": semantic.line,
    "--color-line-strong": semantic.lineStrong
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
    "--color-brand-ink": brandText.ink,
    "--color-brand-ink-hover": brandText.inkHover,
    "--td-brand-color": brand,
    "--td-brand-color-hover": brandHover,
    "--td-brand-color-active": brandActive,
    "--td-brand-color-focus": brandFocus,
    "--td-brand-color-disabled": brandDisabled,
    "--td-brand-color-light": brandSoft,
    "--td-brand-color-light-hover": brandSoftHover,
    "--td-text-color-brand": brandText.ink,
    "--td-text-color-link": brandText.ink,
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
