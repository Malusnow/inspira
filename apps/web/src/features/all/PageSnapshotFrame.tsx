import { useEffect, useLayoutEffect, useRef, useState } from "react"

const SNAPSHOT_VIEWPORT_WIDTH = 1440
const SNAPSHOT_VIEWPORT_HEIGHT = 900
// Mount a frame slightly before it reaches the viewport, so the placeholder is
// never visible while scrolling.
const SNAPSHOT_MOUNT_MARGIN = "600px"
const CAN_OBSERVE_VIEWPORT = typeof IntersectionObserver !== "undefined"

export interface PageSnapshotFrameProps {
  title: string
  url?: string
  interactive?: boolean
  className?: string
}

export function PageSnapshotFrame({
  title,
  url,
  interactive = false,
  className
}: PageSnapshotFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  // A list renders one frame per saved page. Every frame used to load its whole
  // snapshot document on mount, so a long list fetched all of them at once and
  // fetched them again whenever a card was remounted. A thumbnail now waits
  // until its card is close to the viewport. The interactive frame is the only
  // content of the detail view, so it loads immediately.
  const [isSnapshotNearViewport, setSnapshotNearViewport] = useState(interactive)

  useEffect(() => {
    if (!url || isSnapshotNearViewport || !CAN_OBSERVE_VIEWPORT) return

    const container = containerRef.current

    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        const shouldLoadSnapshot = entries.some(
          (entry) =>
            entry.isIntersecting ||
            // A zero-area container can never intersect, so waiting for the
            // observer would leave the frame empty forever.
            entry.boundingClientRect.width === 0 ||
            entry.boundingClientRect.height === 0
        )

        if (!shouldLoadSnapshot) return

        observer.disconnect()
        setSnapshotNearViewport(true)
      },
      { rootMargin: SNAPSHOT_MOUNT_MARGIN }
    )

    observer.observe(container)

    return () => observer.disconnect()
  }, [isSnapshotNearViewport, url])

  // Without IntersectionObserver the frame falls back to loading right away.
  const shouldRenderSnapshot =
    Boolean(url) && (isSnapshotNearViewport || !CAN_OBSERVE_VIEWPORT)

  useLayoutEffect(() => {
    if (!shouldRenderSnapshot) return

    const observedContainer = containerRef.current

    if (!observedContainer) return

    function updateScale(container: HTMLDivElement) {
      const rect = container.getBoundingClientRect()

      setScale(
        Math.min(
          rect.width / SNAPSHOT_VIEWPORT_WIDTH,
          rect.height / SNAPSHOT_VIEWPORT_HEIGHT
        )
      )
    }

    // Measured before the first paint of the frame, so the snapshot is never
    // shown unscaled.
    updateScale(observedContainer)

    const resizeObserver = new ResizeObserver(() =>
      updateScale(observedContainer)
    )

    resizeObserver.observe(observedContainer)

    return () => resizeObserver.disconnect()
  }, [shouldRenderSnapshot])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg border border-line bg-white shadow-inner ${className ?? ""}`}>
      {shouldRenderSnapshot ? (
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: SNAPSHOT_VIEWPORT_WIDTH,
            height: SNAPSHOT_VIEWPORT_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`
          }}>
          <iframe
            title={title}
            src={url}
            sandbox=""
            tabIndex={interactive ? 0 : -1}
            scrolling={interactive ? "auto" : "no"}
            className={`size-full border-0 bg-white ${
              interactive ? "" : "pointer-events-none"
            }`}
          />
        </div>
      ) : url ? (
        <div aria-hidden="true" className="size-full bg-surface-hover" />
      ) : (
        <div className="grid size-full place-items-center bg-surface-hover px-4 text-center text-xs text-ink-muted">
          网页快照暂不可用
        </div>
      )}
    </div>
  )
}
