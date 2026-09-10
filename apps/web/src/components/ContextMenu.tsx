import { Fragment, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { useDismissOnOutsidePointer } from "../hooks/useDismissOnOutsidePointer"
import {
  useViewportClampedPosition,
  type ViewportPoint
} from "../hooks/useViewportClampedPosition"

export interface ContextMenuItem {
  id: string
  label: string
  intent?: "danger" | "default"
  /** Optional leading glyph; the caller owns its size and color. */
  icon?: ReactNode
  onSelect: () => void
}

export interface ContextMenuProps {
  children: ReactNode
  items: ContextMenuItem[]
  label: string
  /** Reports the pointer position each time the menu opens. */
  onOpen?: (position: ViewportPoint) => void
}

/**
 * Right-click menu wrapper. Positions itself at the pointer and clamps to the
 * viewport using the menu's measured size (no hard-coded dimensions).
 *
 * The menu is portaled to `document.body` because page wrappers animate with a
 * transform, and a transformed ancestor turns `position: fixed` into a
 * containing block — which would offset the menu from the pointer.
 */
export function ContextMenu({
  children,
  items,
  label,
  onOpen
}: ContextMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [anchor, setAnchor] = useState<ViewportPoint>({ x: 0, y: 0 })
  const position = useViewportClampedPosition(anchor, menuRef, items.length)

  useDismissOnOutsidePointer({
    enabled: isOpen,
    // The menu lives in a portal, so it is not inside `rootRef`.
    layers: [rootRef, menuRef],
    onDismiss: () => setIsOpen(false)
  })

  return (
    <div
      ref={rootRef}
      className="relative"
      onContextMenu={(event) => {
        event.preventDefault()

        const nextPosition = { x: event.clientX, y: event.clientY }

        setAnchor(nextPosition)
        setIsOpen(true)
        onOpen?.(nextPosition)
      }}>
      {children}

      {isOpen
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={label}
              className="workspace-context-menu fixed z-50 min-w-44 overflow-hidden rounded-lg bg-surface p-1 text-sm text-ink shadow-[0_18px_48px_rgb(37_43_53/0.22)]"
              style={{ left: position.x, top: position.y }}>
              {items.map((item, index) => (
                <Fragment key={item.id}>
                  {item.intent === "danger" && index > 0 ? (
                    <span
                      aria-hidden
                      className="-mx-1 my-1 block h-px bg-line"
                    />
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false)
                      item.onSelect()
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3.5 py-2.5 text-left transition duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none ${
                      item.intent === "danger"
                        ? "text-ink-strong hover:text-danger"
                        : "text-ink-strong"
                    }`}>
                    {item.icon ? (
                      <span
                        aria-hidden
                        className="grid size-4 shrink-0 place-items-center">
                        {item.icon}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
