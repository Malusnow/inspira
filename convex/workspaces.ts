import { ConvexError } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"
import { requireOwner } from "./lib/auth"
import { toInspiration } from "./lib/notes"
import {
  addWorkspaceItemArgs,
  cleanWorkspaceIds,
  cleanWorkspaceName,
  createWorkspaceArgs,
  deleteWorkspaceMembership,
  deleteWorkspaceMembershipsForWorkspace,
  ensureWorkspaceMemberships,
  listWorkspaceIdsForInspiration,
  listWorkspaceMembershipsByWorkspace,
  removeWorkspaceItemArgs,
  renameWorkspaceArgs,
  resolveOwnedWorkspaceIds,
  setItemWorkspacesArgs,
  syncWorkspaceMemberships,
  touchWorkspaces,
  toWorkspaceNameKey,
  workspaceIdArgs,
  workspaceItemUnavailableError,
  workspaceUnavailableError
} from "./lib/workspaces"
import { mediaAssetIdsFromContent } from "./media"

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
    throw workspaceUnavailableError()
  }

  return workspace
}

async function getAssetUrl(
  ctx: QueryCtx,
  assetId: Id<"mediaAssets"> | undefined
) {
  if (!assetId) return undefined

  const asset = await ctx.db.get(assetId)
  if (!asset || asset.status !== "available" || !asset.storageId) {
    return undefined
  }

  return (await ctx.storage.getUrl(asset.storageId)) ?? undefined
}

async function hydrateWorkspaceItem(ctx: QueryCtx, doc: Doc<"inspirations">) {
  const workspaceIds = await listWorkspaceIdsForInspiration(
    ctx,
    doc.ownerId,
    doc._id
  )
  const item = toInspiration(doc, workspaceIds)
  const mediaAssets: NonNullable<typeof item.mediaAssets> = {}

  if (doc.primaryAssetId) {
    const asset = await ctx.db.get(doc.primaryAssetId)
    const url =
      asset?.status === "available" && asset.storageId
        ? await ctx.storage.getUrl(asset.storageId)
        : undefined

    if (asset) {
      item.primaryAssetUrl = url ?? undefined
      mediaAssets[asset._id] = {
        id: asset._id,
        kind: asset.kind,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
        status: asset.status,
        usage: asset.usage,
        sourceUrl: asset.sourceUrl,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
        url: url ?? undefined
      }
    }
  }

  for (const assetId of mediaAssetIdsFromContent(ctx, doc.content)) {
    const asset = await ctx.db.get(assetId)
    const url =
      asset?.status === "available" && asset.storageId
        ? await ctx.storage.getUrl(asset.storageId)
        : undefined

    if (asset) {
      mediaAssets[asset._id] = {
        id: asset._id,
        kind: asset.kind,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
        status: asset.status,
        usage: asset.usage,
        sourceUrl: asset.sourceUrl,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
        url: url ?? undefined
      }
    }
  }

  if (doc.pageSnapshotId) {
    const snapshot = await ctx.db.get(doc.pageSnapshotId)

    if (snapshot && snapshot.ownerId === doc.ownerId) {
      item.pageSnapshot = {
        id: snapshot._id,
        htmlAssetId: snapshot.htmlAssetId,
        htmlUrl: await getAssetUrl(ctx, snapshot.htmlAssetId),
        previewAssetId: snapshot.previewAssetId,
        previewUrl: await getAssetUrl(ctx, snapshot.previewAssetId),
        originalUrl: snapshot.originalUrl,
        capturedAt: snapshot.capturedAt
      }
    }
  }

  if (Object.keys(mediaAssets).length > 0) {
    item.mediaAssets = mediaAssets
  }

  return item
}

async function toPreviewItem(
  ctx: QueryCtx,
  ownerId: string,
  doc: Doc<"inspirations">
) {
  const snapshot = doc.pageSnapshotId
    ? await ctx.db.get(doc.pageSnapshotId)
    : null

  return {
    id: doc._id,
    type: doc.type,
    title: doc.title,
    text: doc.content,
    primaryAssetUrl: await getAssetUrl(ctx, doc.primaryAssetId),
    pageSnapshotUrl:
      snapshot && snapshot.ownerId === ownerId
        ? await getAssetUrl(ctx, snapshot.htmlAssetId)
        : undefined,
    createdAt: doc.createdAt
  }
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx)
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .take(WORKSPACE_ITEM_LIMIT)

    // One membership query per workspace, then hydrate the newest preview items.
    // `itemCount` is the membership count, so an item that belongs to several
    // workspaces is counted once in each of them and never duplicated inside one.
    return await Promise.all(
      workspaces.map(async (workspace) => {
        const memberships = await listWorkspaceMembershipsByWorkspace(
          ctx,
          ownerId,
          workspace._id,
          WORKSPACE_ITEM_LIMIT
        )
        const previewItems = await Promise.all(
          memberships.slice(0, PREVIEW_ITEM_LIMIT).map(async (membership) => {
            const item = await ctx.db.get(membership.inspirationId)

            if (!item || item.ownerId !== ownerId) {
              return null
            }

            return await toPreviewItem(ctx, ownerId, item)
          })
        )

        return {
          id: workspace._id,
          name: workspace.name,
          itemCount: memberships.length,
          preview: {
            items: previewItems.filter(
              (item): item is NonNullable<typeof item> => item !== null
            )
          },
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt
        }
      })
    )
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
    const memberships = await listWorkspaceMembershipsByWorkspace(
      ctx,
      ownerId,
      workspace._id,
      WORKSPACE_ITEM_LIMIT
    )
    const docs = await Promise.all(
      memberships.map((membership) => ctx.db.get(membership.inspirationId))
    )
    // A single workspace stores one membership per item, so the hydrated list
    // cannot contain the same inspiration twice.
    const items = docs.filter(
      (doc): doc is Doc<"inspirations"> =>
        doc !== null && doc.ownerId === ownerId
    )

    return {
      id: workspace._id,
      name: workspace.name,
      items: await Promise.all(
        items.map((item) => hydrateWorkspaceItem(ctx, item))
      ),
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    }
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

/**
 * Deletes the workspace and its memberships only. Inspirations stay in the
 * owner's library, and their memberships in other workspaces are untouched.
 */
export const remove = mutation({
  args: workspaceIdArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const workspace = await getOwnedWorkspace(ctx, args.id, ownerId)

    await deleteWorkspaceMembershipsForWorkspace(ctx, ownerId, workspace._id)
    await ctx.db.delete(workspace._id)

    return workspace._id
  }
})

/** Removes a single membership; the content itself is left untouched. */
export const removeItem = mutation({
  args: removeWorkspaceItemArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const workspace = await getOwnedWorkspace(ctx, args.workspaceId, ownerId)
    const item = await ctx.db.get(args.inspirationId)

    if (!item || item.ownerId !== ownerId) {
      throw workspaceItemUnavailableError()
    }

    const removed = await deleteWorkspaceMembership(
      ctx,
      ownerId,
      item._id,
      workspace._id
    )

    if (!removed) {
      throw workspaceItemUnavailableError()
    }

    await touchWorkspaces(ctx, [workspace._id])

    return item._id
  }
})

/**
 * Adds one membership without disturbing the item's other workspaces. Already
 * present memberships are a no-op, so this is safe to retry.
 */
export const addItem = mutation({
  args: addWorkspaceItemArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const workspace = await getOwnedWorkspace(ctx, args.workspaceId, ownerId)
    const item = await ctx.db.get(args.inspirationId)

    if (!item || item.ownerId !== ownerId) {
      throw workspaceItemUnavailableError()
    }

    const added = await ensureWorkspaceMemberships(ctx, ownerId, item._id, [
      workspace._id
    ])

    if (added.length > 0) {
      await touchWorkspaces(ctx, [workspace._id])
    }

    return item._id
  }
})

/**
 * Replaces the item's whole workspace set. Used by the Web multi-select editor:
 * missing memberships are added, unchecked ones are removed, so a selected
 * workspace never silently pushes the item out of another one.
 */
export const setItemWorkspaces = mutation({
  args: setItemWorkspacesArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const item = await ctx.db.get(args.inspirationId)

    if (!item || item.ownerId !== ownerId) {
      throw workspaceItemUnavailableError()
    }

    const workspaceIds = await resolveOwnedWorkspaceIds(
      ctx,
      ownerId,
      // Normalized like the note / capture write paths so the multi-select
      // editor cannot bypass the per-inspiration workspace cap.
      cleanWorkspaceIds({ workspaceIds: args.workspaceIds })
    )
    const { added, removed } = await syncWorkspaceMemberships(
      ctx,
      ownerId,
      item._id,
      workspaceIds
    )

    await touchWorkspaces(ctx, [...added, ...removed])

    return item._id
  }
})
