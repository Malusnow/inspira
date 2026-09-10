import { useLayoutEffect, useState, type RefObject } from "react"

/** Gap kept between a floating layer and the viewport edges. */
const VIEWPORT_MARGIN = 8

export interface ViewportPoint {
  x: number
  y: number
}

/**
 * Keeps a measured floating layer inside the viewport, so an anchor near the
 * right/bottom edge opens the layer inwards instead of off-screen.
 *
 * The layer is re-measured whenever the anchor or `measureKey` changes; pass a
 * value that tracks the layer's height (item count, loaded list, …) because the
 * clamp needs the real size, not a hard-coded one.
 */
export function useViewportClampedPosition<T extends HTMLElement>(
  anchor: ViewportPoint,
  layerRef: RefObject<T | null>,
  measureKey?: unknown
) {
  const [position, setPosition] = useState(anchor)

  useLayoutEffect(() => {
    const layer = layerRef.current

    if (!layer) return

    const { width, height } = layer.getBoundingClientRect()

    setPosition({
      x: Math.max(
        VIEWPORT_MARGIN,
        Math.min(anchor.x, window.innerWidth - width - VIEWPORT_MARGIN)
      ),
      y: Math.max(
        VIEWPORT_MARGIN,
        Math.min(anchor.y, window.innerHeight - height - VIEWPORT_MARGIN)
      )
    })
  }, [anchor.x, anchor.y, layerRef, measureKey])

  return position
}
