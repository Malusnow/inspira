import type { InspirationType } from "./content"
import type { InspirationItem } from "./notes"

export const WORKSPACE_NAME_MAX_LENGTH = 60
/**
 * Upper bound on how many workspaces a single inspiration may belong to. Kept
 * in sync with the picker UI, which renders the memberships in a scroll list.
 */
export const INSPIRATION_WORKSPACE_MAX_COUNT = 12

export interface WorkspacePreviewItem {
  id: string
  type: InspirationType
  title?: string
  text?: string
  primaryAssetUrl?: string
  pageSnapshotUrl?: string
  createdAt: number
}

/** Thumbnails only: counts live on `WorkspaceSummary.itemCount`. */
export interface WorkspacePreview {
  items: WorkspacePreviewItem[]
}

export interface WorkspaceSummary {
  id: string
  name: string
  itemCount: number
  preview: WorkspacePreview
  createdAt: number
  updatedAt: number
}

export interface WorkspaceOption {
  id: string
  name: string
}

export interface WorkspaceDetail {
  id: string
  name: string
  items: InspirationItem[]
  createdAt: number
  updatedAt: number
}

export function normalizeWorkspaceName(name: string) {
  return name.trim()
}

export function getWorkspaceNameKey(name: string) {
  return normalizeWorkspaceName(name).toLocaleLowerCase()
}

export function validateWorkspaceName(name: string) {
  const normalizedName = normalizeWorkspaceName(name)

  if (!normalizedName) {
    throw new Error("Workspace name is required.")
  }

  if (normalizedName.length > WORKSPACE_NAME_MAX_LENGTH) {
    throw new Error(
      `Workspace name must be ${WORKSPACE_NAME_MAX_LENGTH} characters or fewer.`
    )
  }

  return normalizedName
}

/** Thrown by `normalizeWorkspaceIds`; the backend maps it to `INVALID_INPUT`. */
export class WorkspaceIdsValidationError extends Error {
  readonly code = "INVALID_INPUT" as const

  constructor(message: string) {
    super(message)
    this.name = "WorkspaceIdsValidationError"
  }
}

/**
 * Cleans a workspace id list before any ownership check. Drops falsy and empty
 * entries, de-duplicates, and enforces `INSPIRATION_WORKSPACE_MAX_COUNT`.
 * Convex ids are opaque, so they are never trimmed or truncated here; existence
 * and ownership are validated against the DB in the backend handler.
 */
export function normalizeWorkspaceIds(input: {
  workspaceIds?: string[]
  workspaceId?: string
}): string[] {
  const candidates = [...(input.workspaceIds ?? []), input.workspaceId]
  const workspaceIds = Array.from(
    new Set(
      candidates.filter(
        (id): id is string => typeof id === "string" && id.length > 0
      )
    )
  )

  if (workspaceIds.length > INSPIRATION_WORKSPACE_MAX_COUNT) {
    throw new WorkspaceIdsValidationError(
      `Use ${INSPIRATION_WORKSPACE_MAX_COUNT} workspaces or fewer.`
    )
  }

  return workspaceIds
}
