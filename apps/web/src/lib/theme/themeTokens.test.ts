import { describe, expect, it } from "vitest"

import { generateColorScale, type HexColor } from "./colorScale"
import { buildThemeVariables } from "./themeTokens"

describe("theme tokens", () => {
  it("uses the selected primary color directly for primary UI roles", () => {
    const primaryColor = "#717fb7" satisfies HexColor
    const scale = generateColorScale(primaryColor)

    const lightTokens = buildThemeVariables(primaryColor, scale, "light")
    const darkTokens = buildThemeVariables(primaryColor, scale, "dark")

    expect(lightTokens["--color-brand"]).toBe(primaryColor)
    expect(lightTokens["--td-brand-color"]).toBe(primaryColor)
    expect(lightTokens["--td-text-color-brand"]).toBe(primaryColor)
    expect(lightTokens["--td-text-color-link"]).toBe(primaryColor)
    expect(darkTokens["--color-brand"]).toBe(primaryColor)
    expect(darkTokens["--td-brand-color"]).toBe(primaryColor)
    expect(darkTokens["--td-text-color-brand"]).toBe(primaryColor)
    expect(darkTokens["--td-text-color-link"]).toBe(primaryColor)
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
})
