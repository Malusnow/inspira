import { ConvexError, v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { requireOwner } from "./lib/auth"
import {
  cleanCreate,
  cleanUpdate,
  createArgs,
  removeArgs,
  STARTER_NOTES_VERSION,
  starters,
  toInspiration,
  updateArgs
} from "./lib/notes"
import {
  deleteWorkspaceMembershipsForInspiration,
  ensureWorkspaceMemberships,
  listWorkspaceIdsForInspiration,
  resolveOwnedWorkspaceIds,
  syncWorkspaceMemberships,
  touchWorkspaces
} from "./lib/workspaces"
import { markAssetsForCleanup, mediaAssetIdsFromContent } from "./media"

async function assertOwnedAvailableAssets(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  assetIds: Id<"mediaAssets">[]
) {
  for (const assetId of assetIds) {
    const asset = await ctx.db.get(assetId)

    if (
      !asset ||
      asset.ownerId !== ownerId ||
      asset.status !== "available" ||
      asset.usage !== "noteEmbed"
    ) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Note media is not available."
      })
    }
  }
}

async function mediaView(
  ctx: QueryCtx | MutationCtx,
  assetId: Id<"mediaAssets">
) {
  const asset = await ctx.db.get(assetId)

  if (!asset || asset.status !== "available" || !asset.storageId) {
    return null
  }

  const url = await ctx.storage.getUrl(asset.storageId)

  return {
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

async function hydrateInspiration(
  ctx: QueryCtx | MutationCtx,
  doc: Doc<"inspirations">
) {
  const workspaceIds = await listWorkspaceIdsForInspiration(
    ctx,
    doc.ownerId,
    doc._id
  )
  const item = toInspiration(doc, workspaceIds)
  const mediaAssets: NonNullable<typeof item.mediaAssets> = {}
  const embeddedIds = mediaAssetIdsFromContent(ctx, doc.content)

  for (const assetId of embeddedIds) {
    const view = await mediaView(ctx, assetId)
    if (view) mediaAssets[assetId] = view
  }

  if (doc.primaryAssetId) {
    const view = await mediaView(ctx, doc.primaryAssetId)
    if (view) {
      item.primaryAssetUrl = view.url
      mediaAssets[doc.primaryAssetId] = view
    }
  }

  if (doc.pageSnapshotId) {
    const snapshot = await ctx.db.get(doc.pageSnapshotId)

    if (snapshot && snapshot.ownerId === doc.ownerId) {
      const htmlAsset = await mediaView(ctx, snapshot.htmlAssetId)
      const previewAsset = snapshot.previewAssetId
        ? await mediaView(ctx, snapshot.previewAssetId)
        : null

      if (htmlAsset) mediaAssets[snapshot.htmlAssetId] = htmlAsset
      if (snapshot.previewAssetId && previewAsset) {
        mediaAssets[snapshot.previewAssetId] = previewAsset
      }

      item.pageSnapshot = {
        id: snapshot._id,
        htmlAssetId: snapshot.htmlAssetId,
        htmlUrl: htmlAsset?.url,
        previewAssetId: snapshot.previewAssetId,
        previewUrl: previewAsset?.url,
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

export const create = mutation({
  args: createArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const note = cleanCreate(args)
    const workspaceIds = await resolveOwnedWorkspaceIds(
      ctx,
      ownerId,
      note.workspaceIds
    )
    const referencedAssetIds = mediaAssetIdsFromContent(ctx, note.content)

    await assertOwnedAvailableAssets(ctx, ownerId, referencedAssetIds)

    const now = Date.now()
    const noteId = await ctx.db.insert("inspirations", {
      ownerId,
      type: "note",
      title: note.title,
      content: note.content,
      notes: note.notes,
      tags: note.tags,
      createdAt: now,
      updatedAt: now
    })

    await ensureWorkspaceMemberships(ctx, ownerId, noteId, workspaceIds)
    await touchWorkspaces(ctx, workspaceIds)

    return noteId
  }
})

export const update = mutation({
  args: updateArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const existingNote = await ctx.db.get(args.id)

    if (!existingNote || existingNote.ownerId !== ownerId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Note is not available."
      })
    }

    const note = cleanUpdate(args)
    const workspaceIds = await resolveOwnedWorkspaceIds(
      ctx,
      ownerId,
      note.workspaceIds
    )
    const previousAssetIds = mediaAssetIdsFromContent(ctx, existingNote.content)
    const nextAssetIds = mediaAssetIdsFromContent(ctx, note.content)

    await assertOwnedAvailableAssets(ctx, ownerId, nextAssetIds)

    const now = Date.now()

    await ctx.db.patch(args.id, {
      title: note.title,
      content: note.content,
      notes: note.notes,
      tags: note.tags,
      updatedAt: now
    })

    await markAssetsForCleanup(
      ctx,
      ownerId,
      previousAssetIds.filter((assetId) => !nextAssetIds.includes(assetId)),
      now
    )

    const { added, removed } = await syncWorkspaceMemberships(
      ctx,
      ownerId,
      args.id,
      workspaceIds
    )
    await touchWorkspaces(ctx, [...added, ...removed])

    return args.id
  }
})

export const remove = mutation({
  args: removeArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const existingNote = await ctx.db.get(args.id)

    if (!existingNote || existingNote.ownerId !== ownerId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Note is not available."
      })
    }

    const assetIds = [
      existingNote.primaryAssetId,
      ...mediaAssetIdsFromContent(ctx, existingNote.content)
    ]

    if (existingNote.pageSnapshotId) {
      const snapshot = await ctx.db.get(existingNote.pageSnapshotId)

      if (snapshot && snapshot.ownerId === ownerId) {
        assetIds.push(snapshot.htmlAssetId, snapshot.previewAssetId)
        await ctx.db.delete(snapshot._id)
      }
    }

    const removedWorkspaceIds = await deleteWorkspaceMembershipsForInspiration(
      ctx,
      ownerId,
      args.id
    )

    await ctx.db.delete(args.id)
    await markAssetsForCleanup(ctx, ownerId, assetIds)
    await touchWorkspaces(ctx, removedWorkspaceIds)

    return args.id
  }
})

export const seedStarterNotes = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx)
    const existingInitialization = await ctx.db
      .query("userInitializations")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first()

    if (existingInitialization?.starterNotesSeededAt) {
      return { created: false, count: 0 }
    }

    const existingNote = await ctx.db
      .query("inspirations")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
      .first()

    if (existingNote) {
      const now = Date.now()

      if (existingInitialization) {
        await ctx.db.patch(existingInitialization._id, {
          starterNotesSeededAt: now,
          starterNotesVersion: STARTER_NOTES_VERSION
        })
      } else {
        await ctx.db.insert("userInitializations", {
          ownerId,
          starterNotesSeededAt: now,
          starterNotesVersion: STARTER_NOTES_VERSION
        })
      }

      return { created: false, count: 0 }
    }

    const now = Date.now()

    for (const [index, note] of starters.entries()) {
      await ctx.db.insert("inspirations", {
        ownerId,
        type: "note",
        title: note.title,
        content: note.content,
        tags: note.tags,
        createdAt: now - index * 60 * 1000,
        updatedAt: now - index * 60 * 1000
      })
    }

    if (existingInitialization) {
      await ctx.db.patch(existingInitialization._id, {
        starterNotesSeededAt: now,
        starterNotesVersion: STARTER_NOTES_VERSION
      })
    } else {
      await ctx.db.insert("userInitializations", {
        ownerId,
        starterNotesSeededAt: now,
        starterNotesVersion: STARTER_NOTES_VERSION
      })
    }

    return { created: true, count: starters.length }
  }
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx)
    const notes = await ctx.db
      .query("inspirations")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .take(100)

    return await Promise.all(notes.map((note) => hydrateInspiration(ctx, note)))
  }
})

export const getMine = query({
  args: {
    id: v.id("inspirations")
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const note = await ctx.db.get(args.id)

    if (!note || note.ownerId !== ownerId) {
      return null
    }

    return await hydrateInspiration(ctx, note)
  }
})
