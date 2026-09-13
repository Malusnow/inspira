import type { WorkspaceSummary } from "@inspira/contracts"
import { CheckIcon } from "tdesign-icons-react"
import { useRef, useState } from "react"
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
  /** Workspaces the note already belongs to; shown as selected. */
  currentWorkspaceIds?: string[]
  isSaving?: boolean
  /** Called with the complete selection once the user saves. */
  onSave: (workspaceIds: string[]) => void
  onClose: () => void
}

/**
 * Multi-select workspace manager anchored to its trigger instead of a modal.
 * Existing memberships start checked, so choosing a workspace can never silently
 * drop the note out of another one — the picker always submits the whole set.
 *
 * Portaled to `document.body` for the same reason as `ContextMenu`: detail
 * layers animate with a transform, which would re-anchor `position: fixed`.
 * The `z-[1600]` keeps it above the tdesign Drawer (`z-index: 1500`) that hosts
 * the note detail.
 */
export function WorkspacePickerPopover({
  anchor,
  workspaces,
  currentWorkspaceIds,
  isSaving = false,
  onSave,
  onClose
}: WorkspacePickerPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const position = useViewportClampedPosition(anchor, rootRef, workspaces)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => currentWorkspaceIds ?? []
  )

  useDismissOnOutsidePointer({
    enabled: true,
    // The popover lives in a portal, so it is never inside the trigger.
    layers: [rootRef],
    onDismiss: onClose,
    // Hosted inside the note detail Drawer, which also listens for Escape.
    captureEscape: true
  })

  const toggle = (workspaceId: string) => {
    setSelectedIds((previous) =>
      previous.includes(workspaceId)
        ? previous.filter((id) => id !== workspaceId)
        : [...previous, workspaceId]
    )
  }

  const hasWorkspaces = workspaces !== undefined && workspaces.length > 0

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-label="管理工作区"
      className="fixed z-[1600] w-56 rounded-xl border border-line/80 bg-surface p-1.5 text-sm shadow-[0_18px_48px_rgb(37_43_53/0.22)]"
      style={{ left: position.x, top: position.y }}>
      <p className="px-3.5 pb-1.5 pt-1 text-xs font-medium text-ink-muted">
        加入工作区
      </p>
      {workspaces === undefined ? (
        <p className="px-3.5 py-2.5 text-ink-muted">工作区加载中…</p>
      ) : workspaces.length === 0 ? (
        <p className="px-3.5 py-2.5 leading-5 text-ink-muted">
          还没有工作区，先去 Workspace 页创建一个吧。
        </p>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          {workspaces.map((workspace) => {
            const isSelected = selectedIds.includes(workspace.id)

            return (
              <button
                key={workspace.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={isSelected}
                disabled={isSaving}
                onClick={() => toggle(workspace.id)}
                className="flex w-full items-center gap-2 rounded-md px-3.5 py-2.5 text-left text-ink-strong transition duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none disabled:cursor-default disabled:opacity-60">
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    isSelected
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-surface"
                  }`}>
                  {isSelected ? <CheckIcon size="12px" /> : null}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate ${
                    isSelected ? "text-ink-strong" : "text-ink"
                  }`}>
                  {workspace.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {hasWorkspaces ? (
        <div className="mt-1 flex items-center justify-end gap-1 border-t border-line/70 pt-1.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="rounded-md px-2.5 py-1.5 text-ink-muted transition duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none disabled:cursor-default disabled:opacity-60">
            取消
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(selectedIds)}
            className="rounded-md bg-brand px-2.5 py-1.5 font-medium text-white transition duration-150 hover:opacity-90 focus-visible:outline-none disabled:cursor-default disabled:opacity-60">
            保存
          </button>
        </div>
      ) : null}
    </div>,
    document.body
  )
}
