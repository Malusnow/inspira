import { ConvexError, v } from "convex/values"

import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import {
  getWorkspaceNameKey,
  validateWorkspaceName,
  type WorkspacePreview,
  type WorkspacePreviewItem,
  type WorkspaceSummary
} from "../../packages/contracts/src/index"
import { toInspiration } from "./notes"

export const createWorkspaceArgs = {
  name: v.string()
}

export const workspaceIdArgs = {
  id: v.id("workspaces")
}

export const removeWorkspaceItemArgs = {
  workspaceId: v.id("workspaces"),
  inspirationId: v.id("inspirations")
}

export const renameWorkspaceArgs = {
  id: v.id("workspaces"),
  name: v.string()
}

export const moveWorkspaceItemArgs = {
  inspirationId: v.id("inspirations"),
  /** Target workspace. Omitted or undefined moves the note back to All. */
  workspaceId: v.optional(v.id("workspaces"))
}

export function cleanWorkspaceName(name: string) {
  try {
    return validateWorkspaceName(name)
  } catch (error) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message:
        error instanceof Error ? error.message : "Invalid workspace name."
    })
  }
}

export function toWorkspaceNameKey(name: string) {
  return getWorkspaceNameKey(name)
}

function toPreviewItem(doc: Doc<"inspirations">): WorkspacePreviewItem {
  return {
    id: doc._id,
    type: doc.type,
    title: doc.title,
    text: doc.content,
    createdAt: doc.createdAt
  }
}

/**
 * Thumbnails for the overview. The item count is carried separately on
 * `WorkspaceSummary`, so nothing has to be inferred from the preview list.
 */
export function buildWorkspacePreview(
  items: Array<Doc<"inspirations">>
): WorkspacePreview {
  return { items: items.slice(0, 3).map(toPreviewItem) }
}

export function toWorkspaceSummary(
  workspace: Doc<"workspaces">,
  items: Array<Doc<"inspirations">>,
  itemCount: number
): WorkspaceSummary {
  return {
    id: workspace._id,
    name: workspace.name,
    itemCount,
    preview: buildWorkspacePreview(items),
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt
  }
}

export function toWorkspaceDetail(
  workspace: Doc<"workspaces">,
  items: Array<Doc<"inspirations">>
) {
  return {
    id: workspace._id,
    name: workspace.name,
    items: items.map(toInspiration),
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt
  }
}

export function unavailableWorkspaceError() {
  return new ConvexError({
    code: "NOT_FOUND",
    message: "Workspace is not available."
  })
}

/**
 * Resolves a client-supplied workspaceId into an owned workspace id.
 * Returns undefined for empty input so notes stay unassigned.
 * Throws when the id is malformed or belongs to another owner, so a client can
 * never attach a note to a workspace it does not own (or a stale id).
 */
export async function resolveOwnedWorkspaceId(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  workspaceId: string | undefined
): Promise<Id<"workspaces"> | undefined> {
  if (!workspaceId) {
    return undefined
  }

  const normalizedId = ctx.db.normalizeId("workspaces", workspaceId)

  if (!normalizedId) {
    throw invalidWorkspaceError()
  }

  const workspace = await ctx.db.get(normalizedId)

  if (!workspace || workspace.ownerId !== ownerId) {
    throw invalidWorkspaceError()
  }

  return normalizedId
}

export function invalidWorkspaceError() {
  return new ConvexError({
    code: "INVALID_INPUT",
    message: "Workspace is not available."
  })
}

/** Bumps a workspace's updatedAt after its membership changes. */
export async function touchWorkspace(
  ctx: MutationCtx,
  workspaceId: Id<"workspaces"> | undefined
) {
  if (!workspaceId) {
    return
  }

  await ctx.db.patch(workspaceId, { updatedAt: Date.now() })
}
