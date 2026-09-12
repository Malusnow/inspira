import type { EChartsOption } from "echarts"
import { init, use as registerEChartsModules, type EChartsType } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { useEffect, useRef, useState } from "react"

import type { EChartsTheme } from "../lib/theme/echartsTheme"

// Only the renderer is registered globally. Each chart registers its own series
// and components next to its option builder, so this wrapper stays chart-agnostic.
// Aliased import: eslint-plugin-react-hooks would otherwise read `use` as a hook.
registerEChartsModules([CanvasRenderer])

export interface EChartProps {
  /** Fully built option. The wrapper applies it and never derives data. */
  option: EChartsOption
  /** Theme from buildEChartsTheme. Read through a ref, so it need not be memoized. */
  theme: EChartsTheme
  /**
   * Identity of the theme. ECharts themes are init-only, so changing this
   * recreates the instance. Must change whenever `theme` changes.
   */
  themeKey: string
  height?: number | string
  className?: string
  ariaLabel?: string
}

const DEFAULT_HEIGHT = 320

export function EChart({
  option,
  theme,
  themeKey,
  height = DEFAULT_HEIGHT,
  className = "",
  ariaLabel
}: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [chart, setChart] = useState<EChartsType | null>(null)
  const themeRef = useRef(theme)

  useEffect(() => {
    themeRef.current = theme
  })

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const instance = init(container, themeRef.current, { renderer: "canvas" })

    setChart(instance)

    return () => {
      setChart(null)
      instance.dispose()
    }
  }, [themeKey])

  useEffect(() => {
    chart?.setOption(option, { notMerge: true })
  }, [chart, option])

  useEffect(() => {
    const container = containerRef.current

    if (!chart || !container) return

    const resizeObserver = new ResizeObserver(() => chart.resize())

    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [chart])

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      style={{ height }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    />
  )
}
