import { ConvexError } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"
import { requireOwner } from "./lib/auth"
import {
  cleanWorkspaceName,
  createWorkspaceArgs,
  moveWorkspaceItemArgs,
  removeWorkspaceItemArgs,
  renameWorkspaceArgs,
  resolveOwnedWorkspaceId,
  touchWorkspace,
  toWorkspaceDetail,
  toWorkspaceNameKey,
  toWorkspaceSummary,
  unavailableWorkspaceError,
  workspaceIdArgs
} from "./lib/workspaces"

const PREVIEW_ITEM_LIMIT = 3
/**
 * Per-request item window, shared by the overview scan, the detail query and
 * workspace deletion so those surfaces agree on how much of a workspace is
 * visible. Anything beyond this window needs real pagination.
 */
const WORKSPACE_ITEM_LIMIT = 500

async function getOwnedWorkspace(
  ctx: QueryCtx | MutationCtx,
  id: Id<"workspaces">,
  ownerId: string
) {
  const workspace = await ctx.db.get(id)

  if (!workspace || workspace.ownerId !== ownerId) {
    throw unavailableWorkspaceError()
  }

  return workspace
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx)
    // One read per table instead of a per-workspace query, so the overview no
    // longer degrades linearly with the number of workspaces. The window is
    // shared by both reads, so the badge count and the thumbnails come from the
    // exact same snapshot of the owner's notes.
    const [workspaces, items] = await Promise.all([
      ctx.db
        .query("workspaces")
        .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
        .order("desc")
        .take(WORKSPACE_ITEM_LIMIT),
      ctx.db
        .query("inspirations")
        .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
        .order("desc")
        .take(WORKSPACE_ITEM_LIMIT)
    ])
    const itemsByWorkspace = new Map<string, Array<Doc<"inspirations">>>()

    for (const item of items) {
      if (!item.workspaceId) continue

      const bucket = itemsByWorkspace.get(item.workspaceId)

      if (bucket) {
        bucket.push(item)
      } else {
        itemsByWorkspace.set(item.workspaceId, [item])
      }
    }

    return workspaces.map((workspace) => {
      const workspaceItems = itemsByWorkspace.get(workspace._id) ?? []

      return toWorkspaceSummary(
        workspace,
        workspaceItems.slice(0, PREVIEW_ITEM_LIMIT),
        workspaceItems.length
      )
    })
  }
})

export const create = mutation({
  args: createWorkspaceArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const name = cleanWorkspaceName(args.name)
    const nameKey = toWorkspaceNameKey(name)
    const existingWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_owner_nameKey", (q) =>
        q.eq("ownerId", ownerId).eq("nameKey", nameKey)
      )
      .first()

    if (existingWorkspace) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Workspace name already exists."
      })
    }

    const now = Date.now()

    return await ctx.db.insert("workspaces", {
      ownerId,
      name,
      nameKey,
      createdAt: now,
      updatedAt: now
    })
  }
})

export const getDetail = query({
  args: workspaceIdArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const workspace = await getOwnedWorkspace(ctx, args.id, ownerId)
    const items = await ctx.db
      .query("inspirations")
      .withIndex("by_owner_workspace_createdAt", (q) =>
        q.eq("ownerId", ownerId).eq("workspaceId", workspace._id)
      )
      .order("desc")
      .take(WORKSPACE_ITEM_LIMIT)

    return toWorkspaceDetail(workspace, items)
  }
})

export const rename = mutation({
  args: renameWorkspaceArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const workspace = await getOwnedWorkspace(ctx, args.id, ownerId)
    const name = cleanWorkspaceName(args.name)
    const nameKey = toWorkspaceNameKey(name)

    if (nameKey === workspace.nameKey) {
      return workspace._id
    }

    const conflictingWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_owner_nameKey", (q) =>
        q.eq("ownerId", ownerId).eq("nameKey", nameKey)
      )
      .first()

    if (conflictingWorkspace && conflictingWorkspace._id !== workspace._id) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Workspace name already exists."
      })
    }

    await ctx.db.patch(workspace._id, {
      name,
      nameKey,
      updatedAt: Date.now()
    })

    return workspace._id
  }
})

export const remove = mutation({
  args: workspaceIdArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const workspace = await getOwnedWorkspace(ctx, args.id, ownerId)
    const items = await ctx.db
      .query("inspirations")
      .withIndex("by_owner_workspace_createdAt", (q) =>
        q.eq("ownerId", ownerId).eq("workspaceId", workspace._id)
      )
      .take(WORKSPACE_ITEM_LIMIT)
    const now = Date.now()

    for (const item of items) {
      await ctx.db.patch(item._id, {
        workspaceId: undefined,
        updatedAt: now
      })
    }

    await ctx.db.delete(workspace._id)

    return workspace._id
  }
})

export const removeItem = mutation({
  args: removeWorkspaceItemArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const workspace = await getOwnedWorkspace(ctx, args.workspaceId, ownerId)
    const item = await ctx.db.get(args.inspirationId)

    if (
      !item ||
      item.ownerId !== ownerId ||
      item.workspaceId !== workspace._id
    ) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workspace item is not available."
      })
    }

    await ctx.db.patch(item._id, {
      workspaceId: undefined,
      updatedAt: Date.now()
    })

    await touchWorkspace(ctx, workspace._id)

    return item._id
  }
})

/**
 * Moves a note between workspaces (or back to All when `workspaceId` is
 * omitted). Ownership of both the note and the target workspace is verified, and
 * both sides get their updatedAt bumped so previews refresh.
 */
export const moveItem = mutation({
  args: moveWorkspaceItemArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const item = await ctx.db.get(args.inspirationId)

    if (!item || item.ownerId !== ownerId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workspace item is not available."
      })
    }

    const targetWorkspaceId = await resolveOwnedWorkspaceId(
      ctx,
      ownerId,
      args.workspaceId
    )
    // Persisted as a plain string, so normalise before comparing and patching.
    const sourceWorkspaceId = item.workspaceId
      ? ctx.db.normalizeId("workspaces", item.workspaceId) ?? undefined
      : undefined

    if (sourceWorkspaceId === targetWorkspaceId) {
      return item._id
    }

    await ctx.db.patch(item._id, {
      workspaceId: targetWorkspaceId,
      updatedAt: Date.now()
    })

    await touchWorkspace(ctx, sourceWorkspaceId)
    await touchWorkspace(ctx, targetWorkspaceId)

    return item._id
  }
})
