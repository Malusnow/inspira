import { describe, expect, it } from "vitest"

import { generateColorScale, type HexColor } from "./colorScale"
import { buildSemanticTokens, buildThemeVariables, contrastRatio } from "./themeTokens"

const MIN_BRAND_TEXT_CONTRAST = 4.5

describe("theme tokens", () => {
  it("uses the selected primary color directly for primary fill roles", () => {
    const primaryColor = "#717fb7" satisfies HexColor
    const scale = generateColorScale(primaryColor)

    const lightTokens = buildThemeVariables(primaryColor, scale, "light")
    const darkTokens = buildThemeVariables(primaryColor, scale, "dark")

    expect(lightTokens["--color-brand"]).toBe(primaryColor)
    expect(lightTokens["--td-brand-color"]).toBe(primaryColor)
    expect(darkTokens["--color-brand"]).toBe(primaryColor)
    expect(darkTokens["--td-brand-color"]).toBe(primaryColor)
  })

  it("keeps brand-colored text readable against the mode surface", () => {
    const samples = ["#000000", "#ffffff", "#0a2540", "#f5e960", "#6c63ff", "#717fb7"] as const

    samples.forEach((primaryColor) => {
      const scale = generateColorScale(primaryColor)

      ;(["light", "dark"] as const).forEach((mode) => {
        const semantic = buildSemanticTokens(mode)
        const tokens = buildThemeVariables(primaryColor, scale, mode)
        const textTokens = [
          tokens["--color-brand-ink"],
          tokens["--color-brand-ink-hover"],
          tokens["--td-text-color-brand"],
          tokens["--td-text-color-link"]
        ]

        textTokens.forEach((color) => {
          expect(contrastRatio(color, semantic.surface)).toBeGreaterThanOrEqual(MIN_BRAND_TEXT_CONTRAST)
        })
      })
    })
  })

  it("lifts extreme primary colors off the raw value for text roles", () => {
    const cases = [
      { primaryColor: "#ffffff", mode: "light" },
      { primaryColor: "#000000", mode: "dark" }
    ] as const

    cases.forEach(({ primaryColor, mode }) => {
      const scale = generateColorScale(primaryColor)
      const tokens = buildThemeVariables(primaryColor, scale, mode)

      expect(tokens["--color-brand-ink"]).not.toBe(primaryColor)
      expect(tokens["--td-text-color-brand"]).not.toBe(primaryColor)
      expect(tokens["--color-brand"]).toBe(primaryColor)
    })
  })

  it("keeps generated scale steps for TDesign scale tokens", () => {
    const primaryColor = "#6c63ff" satisfies HexColor
    const scale = generateColorScale(primaryColor)
    const tokens = buildThemeVariables(primaryColor, scale, "light")

    scale.forEach((color, index) => {
      expect(tokens[`--td-brand-color-${index + 1}`]).toBe(color)
    })
  })

  it("keeps hover and active colors visible for extreme primary colors", () => {
    const samples = ["#000000", "#ffffff"] as const

    samples.forEach((primaryColor) => {
      const scale = generateColorScale(primaryColor)

      ;(["light", "dark"] as const).forEach((mode) => {
        const tokens = buildThemeVariables(primaryColor, scale, mode)

        expect(tokens["--td-brand-color-hover"]).not.toBe(primaryColor)
        expect(tokens["--td-brand-color-active"]).not.toBe(primaryColor)
      })
    })
  })

  it("keeps the css variables in sync with the shared semantic tokens", () => {
    const primaryColor = "#6c63ff" satisfies HexColor
    const scale = generateColorScale(primaryColor)

    ;(["light", "dark"] as const).forEach((mode) => {
      const semantic = buildSemanticTokens(mode)
      const tokens = buildThemeVariables(primaryColor, scale, mode)

      expect(tokens["--color-canvas"]).toBe(semantic.canvas)
      expect(tokens["--color-surface"]).toBe(semantic.surface)
      expect(tokens["--color-surface-hover"]).toBe(semantic.surfaceHover)
      expect(tokens["--color-raised"]).toBe(semantic.raised)
      expect(tokens["--color-ink-strong"]).toBe(semantic.inkStrong)
      expect(tokens["--color-ink"]).toBe(semantic.ink)
      expect(tokens["--color-ink-muted"]).toBe(semantic.inkMuted)
      expect(tokens["--color-line"]).toBe(semantic.line)
      expect(tokens["--color-line-strong"]).toBe(semantic.lineStrong)
    })
  })
})
