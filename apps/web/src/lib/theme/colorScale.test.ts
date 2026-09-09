import { describe, expect, it } from "vitest"

import * as colorScale from "./colorScale"
import { generateColorScale, normalizeHex, type HexColor } from "./colorScale"

const HEX_PATTERN = /^#[\da-f]{6}$/

function hexToSrgb(hex: HexColor) {
  return [
    Number.parseInt(hex.slice(1, 3), 16) / 255,
    Number.parseInt(hex.slice(3, 5), 16) / 255,
    Number.parseInt(hex.slice(5, 7), 16) / 255
  ] as const
}

function srgbChannelToLinear(value: number) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function srgbToOklabLightness(hex: HexColor) {
  const [red, green, blue] = hexToSrgb(hex).map(srgbChannelToLinear)
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)

  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
}

describe("color scale", () => {
  it("normalizes strict hex input", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc")
    expect(normalizeHex("#A1B2C3")).toBe("#a1b2c3")
  })

  it("rejects invalid input", () => {
    expect(() => normalizeHex("")).toThrow(RangeError)
    expect(() => normalizeHex("red")).toThrow(RangeError)
    expect(() => normalizeHex("#12")).toThrow(RangeError)
    expect(() => normalizeHex("#12345g")).toThrow(RangeError)
    expect(() => generateColorScale("#1234")).toThrow(RangeError)
  })

  it("exports only the Inspira theme surface", () => {
    expect(Object.keys(colorScale).sort()).toEqual(["generateColorScale", "normalizeHex"])
  })

  it("creates deterministic ten-color lowercase scales preserving the source", () => {
    const scale = generateColorScale("#6C63FF")

    expect(generateColorScale("#6C63FF")).toEqual(scale)
    expect(scale).toHaveLength(10)
    expect(scale.every((color) => HEX_PATTERN.test(color))).toBe(true)
    expect(new Set(scale).size).toBe(10)
    expect(scale).toContain("#6c63ff")
  })

  it("orders scale colors from light to dark in OKLab lightness", () => {
    const scale = generateColorScale("#0ea5e9")
    const lightnesses = scale.map(srgbToOklabLightness)

    expect(lightnesses.every((value, index) => index === 0 || lightnesses[index - 1] > value)).toBe(true)
  })

  it("handles representative edge colors", () => {
    const samples = ["#000000", "#ffffff", "#777777", "#ffd400", "#00ffff", "#6236ff"] as const

    samples.forEach((sample) => {
      const scale = generateColorScale(sample)

      expect(scale).toHaveLength(10)
      expect(scale.every((color) => HEX_PATTERN.test(color))).toBe(true)
      expect(new Set(scale).size).toBe(10)
      expect(scale).toContain(sample)
    })
  })
})
