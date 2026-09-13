import { useEffect, useRef, useState } from "react"

const SNAPSHOT_VIEWPORT_WIDTH = 1440
const SNAPSHOT_VIEWPORT_HEIGHT = 900

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

  useEffect(() => {
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

    updateScale(observedContainer)

    const resizeObserver = new ResizeObserver(() =>
      updateScale(observedContainer)
    )

    resizeObserver.observe(observedContainer)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg border border-line bg-white shadow-inner ${className ?? ""}`}>
      {url ? (
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
      ) : (
        <div className="grid size-full place-items-center bg-surface-hover px-4 text-center text-xs text-ink-muted">
          网页快照暂不可用
        </div>
      )}
    </div>
  )
}
