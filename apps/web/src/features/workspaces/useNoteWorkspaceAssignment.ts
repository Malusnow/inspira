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
  isSaving: boolean
  requestAssignment: (note: InspirationItem, anchor: ViewportPoint) => void
  closePicker: () => void
  save: (workspaceIds: string[]) => Promise<void>
}

function toIdSet(workspaceIds: string[]) {
  return new Set(workspaceIds)
}

function isSameSelection(current: string[], next: string[]) {
  if (current.length !== next.length) return false

  const currentIds = toIdSet(current)

  return next.every((workspaceId) => currentIds.has(workspaceId))
}

function describeSave(
  names: string[],
  addedCount: number,
  removedCount: number
) {
  if (names.length === 0) {
    return removedCount > 0 ? "已移出所有工作区" : "已更新工作区"
  }

  if (names.length === 1) {
    return addedCount > 0 ? `已加入「${names[0]}」` : `已更新「${names[0]}」`
  }

  return `已加入 ${names.length} 个工作区`
}

/**
 * "Manage this note's workspaces" flow shared by the All page (anchored at the
 * right-click menu) and the note detail (anchored at the button). Owns the
 * picker anchor, the overview query and the in-flight guard, so neither surface
 * re-implements them — and the anchor can never get out of sync with the note.
 *
 * The picker submits the complete selection, so this is `setItemWorkspaces`:
 * checked workspaces are added, unchecked ones are the only memberships removed.
 */
export function useNoteWorkspaceAssignment(): UseNoteWorkspaceAssignmentResult {
  const workspaces = useWorkspaceOverviewData()
  const { setItemWorkspaces } = useWorkspaceMutations()
  const [pending, setPending] = useState<PendingWorkspaceAssignment | null>(
    null
  )
  const [isSaving, setIsSaving] = useState(false)

  const requestAssignment = useCallback(
    (note: InspirationItem, anchor: ViewportPoint) => {
      setPending({ note, anchor })
    },
    []
  )

  const closePicker = useCallback(() => {
    if (isSaving) return

    setPending(null)
  }, [isSaving])

  const save = useCallback(
    async (workspaceIds: string[]) => {
      if (!pending || isSaving) return

      const { note } = pending
      const currentIds = note.workspaceIds
      // Re-submitting the same set is a no-op, so the picker can close without
      // a pointless write and a misleading "updated" toast.
      if (isSameSelection(currentIds, workspaceIds)) {
        setPending(null)
        return
      }

      const nextIds = toIdSet(workspaceIds)
      const currentIdSet = toIdSet(currentIds)
      const names = (workspaces ?? [])
        .filter((workspace) => nextIds.has(workspace.id))
        .map((workspace) => workspace.name)
      // An id the overview query has not caught up with yet still counts as
      // added; the message only needs the names it can resolve.
      const addedCount = workspaceIds.filter(
        (workspaceId) => !currentIdSet.has(workspaceId)
      ).length
      const removedCount = currentIds.filter(
        (workspaceId) => !nextIds.has(workspaceId)
      ).length

      setIsSaving(true)

      try {
        await setItemWorkspaces(note.id, workspaceIds)
        setPending(null)
        void MessagePlugin.success({
          content: describeSave(names, addedCount, removedCount),
          placement: "bottom-right"
        })
      } catch (error) {
        console.error("Failed to update note workspaces", error)
        void MessagePlugin.error({
          content: "保存失败，请稍后再试",
          placement: "bottom-right"
        })
      } finally {
        setIsSaving(false)
      }
    },
    [isSaving, pending, setItemWorkspaces, workspaces]
  )

  return {
    pending,
    workspaces,
    isSaving,
    requestAssignment,
    closePicker,
    save
  }
}
