import type { WorkspaceDetail, WorkspaceSummary } from "@inspira/contracts"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useMemo } from "react"

import { api } from "../../../../../convex/_generated/api"
import { toInspirationId, toWorkspaceId } from "../../lib/convexIds"

/**
 * Single in-flight workspace action. Every workspace surface serialises on it,
 * so one confirm dialog can never race the action that opened it. `null` means
 * idle.
 */
export type WorkspacePendingAction =
  | "create"
  | "rename"
  | "delete-workspace"
  | "remove-item"
  | "delete-item"

export function useWorkspaceOverviewData() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const workspaces = useQuery(
    api.workspaces.listMine,
    isAuthenticated ? {} : "skip"
  ) as WorkspaceSummary[] | undefined

  if (!isAuthenticated && !isLoading) {
    return [] as WorkspaceSummary[]
  }

  return workspaces
}

export function useWorkspaceDetailData(workspaceId: string | null) {
  return useQuery(
    api.workspaces.getDetail,
    workspaceId ? { id: toWorkspaceId(workspaceId) } : "skip"
  ) as WorkspaceDetail | undefined
}

export function useWorkspaceMutations() {
  const createWorkspaceMutation = useMutation(api.workspaces.create)
  const renameWorkspaceMutation = useMutation(api.workspaces.rename)
  const removeWorkspaceMutation = useMutation(api.workspaces.remove)
  const removeItemMutation = useMutation(api.workspaces.removeItem)
  const addItemMutation = useMutation(api.workspaces.addItem)
  const setItemWorkspacesMutation = useMutation(api.workspaces.setItemWorkspaces)

  // Memoised, so callers can safely list these in effect dependencies.
  return useMemo(
    () => ({
      createWorkspace(name: string) {
        return createWorkspaceMutation({ name })
      },
      renameWorkspace(id: string, name: string) {
        return renameWorkspaceMutation({ id: toWorkspaceId(id), name })
      },
      removeWorkspace(id: string) {
        return removeWorkspaceMutation({ id: toWorkspaceId(id) })
      },
      /** Removes one membership; the inspiration itself is kept. */
      removeWorkspaceItem(workspaceId: string, inspirationId: string) {
        return removeItemMutation({
          workspaceId: toWorkspaceId(workspaceId),
          inspirationId: toInspirationId(inspirationId)
        })
      },
      /** Adds one membership, leaving the item's other workspaces intact. */
      addWorkspaceItem(workspaceId: string, inspirationId: string) {
        return addItemMutation({
          workspaceId: toWorkspaceId(workspaceId),
          inspirationId: toInspirationId(inspirationId)
        })
      },
      /**
       * Replaces the item's whole workspace set. The multi-select editor sends
       * the full selection, so unchecking a workspace removes only that one.
       */
      setItemWorkspaces(inspirationId: string, workspaceIds: string[]) {
        return setItemWorkspacesMutation({
          inspirationId: toInspirationId(inspirationId),
          workspaceIds
        })
      }
    }),
    [
      addItemMutation,
      createWorkspaceMutation,
      removeItemMutation,
      removeWorkspaceMutation,
      renameWorkspaceMutation,
      setItemWorkspacesMutation
    ]
  )
}
