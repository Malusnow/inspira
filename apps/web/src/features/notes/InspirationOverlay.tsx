import type { NoteInspiration } from "@inspira/contracts"
import { useCallback, useEffect, useRef, useState } from "react"

import { useEscapeKey } from "../../hooks/useEscapeKey"
import { NoteComposer } from "./NoteComposer"

export interface InspirationOverlayProps {
  note?: NoteInspiration
  visible: boolean
  onDismiss: () => void
}

export function InspirationOverlay({
  note,
  visible,
  onDismiss
}: InspirationOverlayProps) {
  const [surfaceState, setSurfaceState] = useState<"entering" | "open" | "leaving">(
    "entering"
  )
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<number | undefined>(undefined)
  const dismissTimerRef = useRef<number | undefined>(undefined)

  const requestDismiss = useCallback(() => {
    if (surfaceState === "leaving") return

    setControlsVisible(false)
    setSurfaceState("leaving")

    if (dismissTimerRef.current !== undefined) {
      window.clearTimeout(dismissTimerRef.current)
    }

    dismissTimerRef.current = window.setTimeout(() => {
      onDismiss()
    }, 520)
  }, [onDismiss, surfaceState])

  useEffect(() => {
    if (!visible) return

    const openTimer = window.setTimeout(() => {
      setSurfaceState("open")
    }, 520)

    return () => {
      window.clearTimeout(openTimer)
      if (dismissTimerRef.current !== undefined) {
        window.clearTimeout(dismissTimerRef.current)
      }
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return

    function revealControls() {
      setControlsVisible(true)

      if (hideTimerRef.current !== undefined) {
        window.clearTimeout(hideTimerRef.current)
      }

      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false)
      }, 3000)
    }

    revealControls()

    window.addEventListener("mousemove", revealControls, { passive: true })
    window.addEventListener("pointermove", revealControls, { passive: true })
    window.addEventListener("scroll", revealControls, {
      capture: true,
      passive: true
    })
    window.addEventListener("touchmove", revealControls, { passive: true })

    return () => {
      if (hideTimerRef.current !== undefined) {
        window.clearTimeout(hideTimerRef.current)
      }

      window.removeEventListener("mousemove", revealControls)
      window.removeEventListener("pointermove", revealControls)
      window.removeEventListener("scroll", revealControls, { capture: true })
      window.removeEventListener("touchmove", revealControls)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [visible])

  useEscapeKey(visible, () => requestDismiss())

  if (!visible) return null

  return (
    <section
      aria-modal="true"
      role="dialog"
      className="inspiration-overlay fixed inset-0 z-50 overflow-hidden opacity-100 backdrop-blur-xl">
      <div
        data-state={surfaceState}
        className="inspiration-surface relative z-10 h-full overflow-y-auto">
        <NoteComposer
          controlsVisible={controlsVisible}
          note={note}
          onDismiss={requestDismiss}
          onFinish={requestDismiss}
        />
      </div>
    </section>
  )
}
