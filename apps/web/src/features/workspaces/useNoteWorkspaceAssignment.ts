import type { InspirationItem } from "@inspira/contracts"
import { useCallback, useState } from "react"
import { MessagePlugin } from "tdesign-react"

import type { ViewportPoint } from "../../hooks/useViewportClampedPosition"
import {
  useWorkspaceMutations,
  useWorkspaceOverviewData
} from "./useWorkspaces"

export interface PendingWorkspaceAssignment {
  note: InspirationItem
  /** Viewport coordinates the picker opens at. */
  anchor: ViewportPoint
}

export interface UseNoteWorkspaceAssignmentResult {
  /** Note + anchor of the open picker, or null while it stays closed. */
  pending: PendingWorkspaceAssignment | null
  workspaces: ReturnType<typeof useWorkspaceOverviewData>
  isAssigning: boolean
  requestAssignment: (note: InspirationItem, anchor: ViewportPoint) => void
  closePicker: () => void
  assign: (workspaceId: string) => Promise<void>
}

/**
 * "Move this note into a workspace" flow shared by the All page (anchored at the
 * right-click menu) and the note detail (anchored at the button). Owns the
 * picker anchor, the overview query and the in-flight guard, so neither surface
 * re-implements them — and the anchor can never get out of sync with the note.
 *
 * Note that `workspaces.moveItem` is a single-assignment write: picking another
 * workspace moves the note out of its previous one.
 */
export function useNoteWorkspaceAssignment(): UseNoteWorkspaceAssignmentResult {
  const workspaces = useWorkspaceOverviewData()
  const { moveWorkspaceItem } = useWorkspaceMutations()
  const [pending, setPending] = useState<PendingWorkspaceAssignment | null>(
    null
  )
  const [isAssigning, setIsAssigning] = useState(false)

  const requestAssignment = useCallback(
    (note: InspirationItem, anchor: ViewportPoint) => {
      setPending({ note, anchor })
    },
    []
  )

  const closePicker = useCallback(() => {
    if (isAssigning) return

    setPending(null)
  }, [isAssigning])

  const assign = useCallback(
    async (workspaceId: string) => {
      if (!pending || isAssigning) return

      const { note } = pending
      const targetName = workspaces?.find(
        (workspace) => workspace.id === workspaceId
      )?.name

      setIsAssigning(true)

      try {
        await moveWorkspaceItem(note.id, workspaceId)
        setPending(null)
        void MessagePlugin.success({
          content: targetName ? `已移动到「${targetName}」` : "已移动到工作区",
          placement: "bottom-right"
        })
      } catch (error) {
        console.error("Failed to move note to workspace", error)
        void MessagePlugin.error({
          content: "移动失败，请稍后再试",
          placement: "bottom-right"
        })
      } finally {
        setIsAssigning(false)
      }
    },
    [isAssigning, moveWorkspaceItem, pending, workspaces]
  )

  return {
    pending,
    workspaces,
    isAssigning,
    requestAssignment,
    closePicker,
    assign
  }
}
