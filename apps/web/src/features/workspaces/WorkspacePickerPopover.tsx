import type { WorkspaceSummary } from "@inspira/contracts"
import { useRef } from "react"
import { createPortal } from "react-dom"

import { useDismissOnOutsidePointer } from "../../hooks/useDismissOnOutsidePointer"
import {
  useViewportClampedPosition,
  type ViewportPoint
} from "../../hooks/useViewportClampedPosition"

export interface WorkspacePickerPopoverProps {
  /** Viewport coordinates of the trigger, in `clientX` / `clientY` space. */
  anchor: ViewportPoint
  /** Undefined while the overview query is still loading. */
  workspaces: WorkspaceSummary[] | undefined
  /** Workspace the note already belongs to; listed, but not selectable. */
  currentWorkspaceId?: string
  isAdding?: boolean
  onSelect: (workspaceId: string) => void
  onClose: () => void
}

/**
 * Workspace picker anchored to its trigger instead of a modal. Picking a row
 * applies immediately, so there is no confirm step — and since a user can own
 * many workspaces, the list scrolls instead of growing past the viewport.
 *
 * Portaled to `document.body` for the same reason as `ContextMenu`: detail
 * layers animate with a transform, which would re-anchor `position: fixed`.
 * The `z-[1600]` keeps it above the tdesign Drawer (`z-index: 1500`) that hosts
 * the note detail.
 */
export function WorkspacePickerPopover({
  anchor,
  workspaces,
  currentWorkspaceId,
  isAdding = false,
  onSelect,
  onClose
}: WorkspacePickerPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const position = useViewportClampedPosition(anchor, rootRef, workspaces)

  useDismissOnOutsidePointer({
    enabled: true,
    // The popover lives in a portal, so it is never inside the trigger.
    layers: [rootRef],
    onDismiss: onClose,
    // Hosted inside the note detail Drawer, which also listens for Escape.
    captureEscape: true
  })

  return createPortal(
    <div
      ref={rootRef}
      role="menu"
      aria-label="移动到工作区"
      className="fixed z-[1600] max-h-72 w-52 overflow-y-auto rounded-xl border border-line/80 bg-surface p-1.5 text-sm shadow-[0_18px_48px_rgb(37_43_53/0.22)]"
      style={{ left: position.x, top: position.y }}>
      {workspaces === undefined ? (
        <p className="px-3.5 py-2.5 text-ink-muted">工作区加载中…</p>
      ) : workspaces.length === 0 ? (
        <p className="px-3.5 py-2.5 leading-5 text-ink-muted">
          还没有工作区，先去 Workspace 页创建一个吧。
        </p>
      ) : (
        workspaces.map((workspace) => {
          const isCurrent = workspace.id === currentWorkspaceId

          return (
            <button
              key={workspace.id}
              type="button"
              role="menuitem"
              disabled={isAdding || isCurrent}
              title={isCurrent ? "已在当前工作区" : undefined}
              onClick={() => onSelect(workspace.id)}
              className="block w-full truncate rounded-md px-3.5 py-2.5 text-left text-ink-strong transition duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none disabled:cursor-default disabled:text-ink-muted/50 disabled:hover:bg-transparent">
              {workspace.name}
            </button>
          )
        })
      )}
    </div>,
    document.body
  )
}
