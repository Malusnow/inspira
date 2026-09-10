import { useEffect, useRef, type RefObject } from "react"

export interface UseDismissOnOutsidePointerOptions {
  enabled: boolean
  /** Portaled layers; a layer is never nested inside the other ones. */
  layers: Array<RefObject<HTMLElement | null>>
  onDismiss: () => void
  /**
   * Captures the Escape keydown instead of letting it bubble. Needed by layers
   * hosted inside a Drawer, whose own Escape handling would win otherwise.
   */
  captureEscape?: boolean
}

/**
 * Closes a floating layer on outside pointer-down or Escape. Handlers are read
 * through refs, so passing a fresh callback on every render never re-binds the
 * listeners.
 */
export function useDismissOnOutsidePointer({
  enabled,
  layers,
  onDismiss,
  captureEscape = false
}: UseDismissOnOutsidePointerOptions) {
  const layersRef = useRef(layers)
  const dismissRef = useRef(onDismiss)

  useEffect(() => {
    layersRef.current = layers
    dismissRef.current = onDismiss
  })

  useEffect(() => {
    if (!enabled) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node

      if (layersRef.current.some((layer) => layer.current?.contains(target))) {
        return
      }

      dismissRef.current()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return

      if (captureEscape) event.stopPropagation()

      dismissRef.current()
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown, captureEscape)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown, captureEscape)
    }
  }, [captureEscape, enabled])
}
