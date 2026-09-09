export type HexColor = `#${string}`

export type ColorScale10 = readonly [
  HexColor,
  HexColor,
  HexColor,
  HexColor,
  HexColor,
  HexColor,
  HexColor,
  HexColor,
  HexColor,
  HexColor
]

const HEX_PATTERN = /^#(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/
const BASE_LIGHTNESS = [0.95, 0.89, 0.81, 0.72, 0.63, 0.55, 0.47, 0.39, 0.3, 0.21] as const
const ACHROMATIC_THRESHOLD = 0.018
const GAMUT_JND = 0.02
const GAMUT_EPSILON = 0.0001
const LIGHTNESS_MODELS = [
  { top: 0.95, bottom: 0.17, lightExponent: 0.88, darkExponent: 1.04 },
  { top: 0.955, bottom: 0.175, lightExponent: 0.96, darkExponent: 1 },
  { top: 0.96, bottom: 0.16, lightExponent: 0.94, darkExponent: 1.08 },
  { top: 0.94, bottom: 0.18, lightExponent: 0.84, darkExponent: 1 },
  { top: 0.95, bottom: 0.17, lightExponent: 1, darkExponent: 1 }
] as const
const CHROMA_MODELS = [
  { lightRetention: 0.76, darkRetention: 0.88, lightSlope: 1, darkSlope: 1 },
  { lightRetention: 0.68, darkRetention: 0.82, lightSlope: 1.14, darkSlope: 1.14 },
  { lightRetention: 0.84, darkRetention: 0.94, lightSlope: 1.08, darkSlope: 1.08 },
  { lightRetention: 0.84, darkRetention: 0.88, lightSlope: 0.92, darkSlope: 1.08 },
  { lightRetention: 0.76, darkRetention: 0.96, lightSlope: 1.08, darkSlope: 0.92 },
  { lightRetention: 0.72, darkRetention: 0.86, lightSlope: 0.9, darkSlope: 0.9 }
] as const

type Rgb = readonly [number, number, number]
type Oklab = readonly [number, number, number]
type Oklch = readonly [number, number, number]

interface GamutMappingResult {
  rgb: Rgb
  deltaE: number
  chromaLoss: number
  wasMapped: boolean
}

interface ScaleCandidate {
  colors: HexColor[]
  metrics: {
    mappingLoss: number
    maximumMappingDeltaE: number
    roleLightnessDeviation: number
    relativeSourceChroma: number
    endpointCapacity: readonly [number, number]
  }
}

export function normalizeHex(source: string): HexColor {
  if (typeof source !== "string" || !HEX_PATTERN.test(source)) {
    throw new RangeError("Expected a color in #RGB or #RRGGBB format.")
  }

  if (source.length === 4) {
    return `#${source[1]}${source[1]}${source[2]}${source[2]}${source[3]}${source[3]}`.toLowerCase() as HexColor
  }

  return source.toLowerCase() as HexColor
}

function hexToSrgb(hex: HexColor): Rgb {
  return [
    Number.parseInt(hex.slice(1, 3), 16) / 255,
    Number.parseInt(hex.slice(3, 5), 16) / 255,
    Number.parseInt(hex.slice(5, 7), 16) / 255
  ]
}

function srgbChannelToLinear(value: number) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function linearChannelToSrgb(value: number) {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
}

function srgbToOklab(rgb: Rgb): Oklab {
  const r = srgbChannelToLinear(rgb[0])
  const g = srgbChannelToLinear(rgb[1])
  const b = srgbChannelToLinear(rgb[2])
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ]
}

function oklabToSrgb(oklab: Oklab): Rgb {
  const l0 = oklab[0] + 0.3963377774 * oklab[1] + 0.2158037573 * oklab[2]
  const m0 = oklab[0] - 0.1055613458 * oklab[1] - 0.0638541728 * oklab[2]
  const s0 = oklab[0] - 0.0894841775 * oklab[1] - 1.291485548 * oklab[2]
  const l = l0 ** 3
  const m = m0 ** 3
  const s = s0 ** 3

  return [
    linearChannelToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearChannelToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearChannelToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  ]
}

function oklabToOklch(oklab: Oklab): Oklch {
  const chroma = Math.hypot(oklab[1], oklab[2])
  const hue = chroma < 1e-7 ? 0 : Math.atan2(oklab[2], oklab[1])

  return [oklab[0], chroma, hue]
}

function oklchToOklab(oklch: Oklch): Oklab {
  return [oklch[0], oklch[1] * Math.cos(oklch[2]), oklch[1] * Math.sin(oklch[2])]
}

function isSrgbInGamut(rgb: Rgb) {
  const epsilon = 1e-7

  return rgb.every((channel) => Number.isFinite(channel) && channel >= -epsilon && channel <= 1 + epsilon)
}

function srgbChannelToHex(value: number) {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, "0")
}

function srgbToHex(rgb: Rgb): HexColor {
  return `#${srgbChannelToHex(rgb[0])}${srgbChannelToHex(rgb[1])}${srgbChannelToHex(rgb[2])}`
}

function clipSrgb(rgb: Rgb): Rgb {
  return rgb.map((channel) => Math.min(1, Math.max(0, channel))) as unknown as Rgb
}

function deltaEOk(one: Oklab, two: Oklab) {
  return Math.hypot(one[0] - two[0], one[1] - two[1], one[2] - two[2])
}

function createGamutMappingResult(originLab: Oklab, originChroma: number, rgb: Rgb): GamutMappingResult {
  const mappedLab = srgbToOklab(rgb)

  return {
    rgb,
    deltaE: deltaEOk(originLab, mappedLab),
    chromaLoss: Math.max(0, originChroma - oklabToOklch(mappedLab)[1]),
    wasMapped: true
  }
}

function gamutMapOklchToSrgb(origin: Oklch): GamutMappingResult {
  const originLab = oklchToOklab(origin)
  const originRgb = oklabToSrgb(originLab)

  if (origin[0] >= 1) return createGamutMappingResult(originLab, origin[1], [1, 1, 1])
  if (origin[0] <= 0) return createGamutMappingResult(originLab, origin[1], [0, 0, 0])
  if (isSrgbInGamut(originRgb)) {
    return { rgb: originRgb, deltaE: 0, chromaLoss: 0, wasMapped: false }
  }

  let clipped = clipSrgb(originRgb)
  let difference = deltaEOk(originLab, srgbToOklab(clipped))
  if (difference < GAMUT_JND) return createGamutMappingResult(originLab, origin[1], clipped)

  let minimum = 0
  let maximum = origin[1]
  let minimumIsInGamut = true

  while (maximum - minimum > GAMUT_EPSILON) {
    const chroma = (minimum + maximum) / 2
    const currentLab = oklchToOklab([origin[0], chroma, origin[2]])
    const currentRgb = oklabToSrgb(currentLab)

    if (minimumIsInGamut && isSrgbInGamut(currentRgb)) {
      minimum = chroma
      continue
    }

    clipped = clipSrgb(currentRgb)
    difference = deltaEOk(currentLab, srgbToOklab(clipped))
    if (difference < GAMUT_JND) {
      if (GAMUT_JND - difference < GAMUT_EPSILON) break
      minimumIsInGamut = false
      minimum = chroma
    } else {
      maximum = chroma
    }
  }

  return createGamutMappingResult(originLab, origin[1], clipped)
}

function findMaxSrgbChroma(lightness: number, hue: number) {
  let low = 0
  let high = 0.42

  for (let iteration = 0; iteration < 18; iteration += 1) {
    const middle = (low + high) / 2
    if (isSrgbInGamut(oklabToSrgb(oklchToOklab([lightness, middle, hue])))) low = middle
    else high = middle
  }

  return low
}

function choosePreferredAnchor(lightness: number) {
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY

  BASE_LIGHTNESS.forEach((candidate, index) => {
    const distance = Math.abs(candidate - lightness)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })

  return bestIndex
}

function createLightnessCurve(
  sourceLightness: number,
  anchor: number,
  model: (typeof LIGHTNESS_MODELS)[number]
) {
  const top = Math.max(sourceLightness, model.top)
  const bottom = Math.min(sourceLightness, model.bottom)

  return BASE_LIGHTNESS.map((_, index) => {
    if (index === anchor) return sourceLightness
    if (index < anchor) {
      const progress = (anchor - index) / anchor
      return sourceLightness + (top - sourceLightness) * progress ** model.lightExponent
    }
    const progress = (index - anchor) / (9 - anchor)
    return sourceLightness - (sourceLightness - bottom) * progress ** model.darkExponent
  })
}

function calculateEndpointChroma(
  relativeSourceChroma: number,
  capacity: number,
  distance: number,
  isLightEnd: boolean,
  model: (typeof CHROMA_MODELS)[number]
) {
  const endBias = isLightEnd ? 0.12 : 0.08
  const retention = isLightEnd ? model.lightRetention : model.darkRetention
  const ratio = Math.min(0.96, relativeSourceChroma * (retention - distance * 0.08) + endBias)

  return capacity * ratio
}

function interpolateChromaEnvelope(
  sourceChroma: number,
  relativeSourceChroma: number,
  chromaLimits: readonly number[],
  index: number,
  anchor: number,
  model: (typeof CHROMA_MODELS)[number]
) {
  if (index === anchor) return sourceChroma

  const isLightSide = index < anchor
  const endpointIndex = isLightSide ? 0 : 9
  const span = Math.abs(endpointIndex - anchor)
  const slope = isLightSide ? model.lightSlope : model.darkSlope
  const progress = (Math.abs(index - anchor) / span) ** slope
  const endpoint = calculateEndpointChroma(
    relativeSourceChroma,
    chromaLimits[endpointIndex],
    span / 9,
    isLightSide,
    model
  )

  return sourceChroma + (endpoint - sourceChroma) * progress
}

function createScaleCandidate(
  sourceOklch: Oklch,
  sourceHex: HexColor,
  anchor: number,
  lightnessModel: (typeof LIGHTNESS_MODELS)[number],
  chromaModel: (typeof CHROMA_MODELS)[number],
  getSrgbChromaLimit: (lightness: number) => number
): ScaleCandidate {
  const lightnesses = createLightnessCurve(sourceOklch[0], anchor, lightnessModel)
  const achromatic = sourceOklch[1] < ACHROMATIC_THRESHOLD
  const chromaLimits = achromatic ? null : lightnesses.map(getSrgbChromaLimit)
  const sourceCapacity = achromatic ? 0 : chromaLimits![anchor]
  const relativeSourceChroma = sourceCapacity > 1e-6 ? Math.min(1, sourceOklch[1] / sourceCapacity) : 0
  let mappingDeltaE = 0
  let maximumMappingDeltaE = 0

  const colors = lightnesses.map((lightness, index) => {
    if (index === anchor) return sourceHex
    if (achromatic) return srgbToHex(oklabToSrgb([lightness, 0, 0]))

    const desiredChroma = interpolateChromaEnvelope(
      sourceOklch[1],
      relativeSourceChroma,
      chromaLimits!,
      index,
      anchor,
      chromaModel
    )
    const mapping = gamutMapOklchToSrgb([lightness, desiredChroma, sourceOklch[2]])
    mappingDeltaE += mapping.deltaE
    maximumMappingDeltaE = Math.max(maximumMappingDeltaE, mapping.deltaE)

    return srgbToHex(mapping.rgb)
  })
  const roleLightnessDeviation =
    lightnesses.reduce((sum, lightness, index) => sum + Math.abs(lightness - BASE_LIGHTNESS[index]), 0) /
    lightnesses.length

  return {
    colors,
    metrics: {
      mappingLoss: mappingDeltaE / 9,
      maximumMappingDeltaE,
      roleLightnessDeviation,
      relativeSourceChroma,
      endpointCapacity: achromatic ? [0, 0] : [chromaLimits![0], chromaLimits![9]]
    }
  }
}

function inspectScale(scale: readonly HexColor[], source: HexColor) {
  const oklabs = scale.map((color) => srgbToOklab(hexToSrgb(color)))
  const lightnesses = oklabs.map((oklab) => oklab[0])
  const adjacentDeltaE = oklabs.slice(1).map((oklab, index) =>
    Math.hypot(oklab[0] - oklabs[index][0], oklab[1] - oklabs[index][1], oklab[2] - oklabs[index][2])
  )
  const meanDeltaE = adjacentDeltaE.reduce((sum, value) => sum + value, 0) / adjacentDeltaE.length
  const deltaEVariation = Math.sqrt(
    adjacentDeltaE.reduce((sum, value) => sum + (value - meanDeltaE) ** 2, 0) / adjacentDeltaE.length
  )
  const anchorIndex = scale.indexOf(source)
  const sourceOklch = oklabToOklch(srgbToOklab(hexToSrgb(source)))
  const hueDrift =
    sourceOklch[1] < ACHROMATIC_THRESHOLD
      ? 0
      : oklabs.reduce((maximum, oklab) => {
          const oklch = oklabToOklch(oklab)
          if (oklch[1] < ACHROMATIC_THRESHOLD) return maximum
          const difference = Math.abs(Math.atan2(Math.sin(oklch[2] - sourceOklch[2]), Math.cos(oklch[2] - sourceOklch[2])))

          return Math.max(maximum, (difference * 180) / Math.PI)
        }, 0)
  const sourceAdjacentDeltaE = [
    anchorIndex > 0 ? adjacentDeltaE[anchorIndex - 1] : null,
    anchorIndex >= 0 && anchorIndex < 9 ? adjacentDeltaE[anchorIndex] : null
  ] as const

  return {
    hasTenColors: scale.length === 10,
    isLightnessMonotonic: lightnesses.every((value, index) => index === 0 || lightnesses[index - 1] > value),
    hasNoDuplicates: new Set(scale).size === scale.length,
    preservesSource: anchorIndex >= 0,
    sourceAdjacentDeltaE,
    maxAdjacentDeltaE: Math.max(...adjacentDeltaE),
    deltaECoefficientVariation: meanDeltaE > 0 ? deltaEVariation / meanDeltaE : 0,
    hueDrift,
    endpointChroma: [
      Math.hypot(oklabs[0][1], oklabs[0][2]),
      Math.hypot(oklabs[9][1], oklabs[9][2])
    ] as const
  }
}

function scoreCandidate(report: ReturnType<typeof inspectScale>, candidateMetrics: ScaleCandidate["metrics"], anchor: number, preferredAnchor: number) {
  const localDeltaE = Math.max(...report.sourceAdjacentDeltaE.filter((value) => value !== null))
  const endpointRatios = candidateMetrics.endpointCapacity.map((capacity, index) =>
    capacity > 1e-6 ? report.endpointChroma[index] / capacity : 0
  )
  const lightTarget = 0.12 + candidateMetrics.relativeSourceChroma * 0.55
  const darkTarget = 0.08 + candidateMetrics.relativeSourceChroma * 0.68
  const endpointPenalty =
    candidateMetrics.relativeSourceChroma > 0
      ? Math.max(0, lightTarget - endpointRatios[0]) + Math.max(0, darkTarget - endpointRatios[1])
      : 0

  return (
    report.maxAdjacentDeltaE * 1.7 +
    report.deltaECoefficientVariation * 0.09 +
    localDeltaE * 0.6 +
    endpointPenalty * 0.035 +
    (report.hueDrift / 180) * 0.03 +
    candidateMetrics.mappingLoss * 0.8 +
    candidateMetrics.roleLightnessDeviation * 0.35 +
    Math.abs(anchor - preferredAnchor) * 0.025
  )
}

export function generateColorScale(source: string): ColorScale10 {
  const sourceHex = normalizeHex(source)
  const sourceOklch = oklabToOklch(srgbToOklab(hexToSrgb(sourceHex)))
  const preferredAnchor = choosePreferredAnchor(sourceOklch[0])
  const anchorOrder = Array.from({ length: 10 }, (_, index) => index).sort(
    (a, b) => Math.abs(a - preferredAnchor) - Math.abs(b - preferredAnchor)
  )
  const srgbChromaLimitCache = new Map<string, number>()
  const getSrgbChromaLimit = (lightness: number) => {
    const key = lightness.toFixed(12)
    const cachedValue = srgbChromaLimitCache.get(key)
    if (cachedValue !== undefined) return cachedValue

    const value = findMaxSrgbChroma(lightness, sourceOklch[2])
    srgbChromaLimitCache.set(key, value)

    return value
  }

  let bestCandidate: ScaleCandidate | null = null
  let bestScore = Number.POSITIVE_INFINITY
  const chromaModels = sourceOklch[1] < ACHROMATIC_THRESHOLD ? [CHROMA_MODELS[0]] : CHROMA_MODELS

  for (const anchor of anchorOrder) {
    if ((anchor === 0 && sourceOklch[0] < 0.9) || (anchor === 9 && sourceOklch[0] > 0.24)) continue
    for (const lightnessModel of LIGHTNESS_MODELS) {
      for (const chromaModel of chromaModels) {
        const candidate = createScaleCandidate(
          sourceOklch,
          sourceHex,
          anchor,
          lightnessModel,
          chromaModel,
          getSrgbChromaLimit
        )
        const report = inspectScale(candidate.colors, sourceHex)

        if (report.hasTenColors && report.isLightnessMonotonic && report.hasNoDuplicates && report.preservesSource) {
          const score = scoreCandidate(report, candidate.metrics, anchor, preferredAnchor)
          if (score < bestScore) {
            bestScore = score
            bestCandidate = candidate
          }
        }
      }
    }
  }

  if (!bestCandidate) {
    throw new RangeError("Unable to create a strict ten-step scale for this sRGB color.")
  }

  return bestCandidate.colors.slice() as unknown as ColorScale10
}
