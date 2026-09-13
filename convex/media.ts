import { ConvexError, v } from "convex/values"

import {
  extractNoteMediaAssetIds,
  MediaValidationError,
  validateMediaUploadIntent,
  type MediaAssetKind,
  type MediaAssetUsage,
  type RequestMediaUploadInput
} from "../packages/contracts/src/index"
import type { Id } from "./_generated/dataModel"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"
import { requireOwner } from "./lib/auth"

const CLEANUP_DELAY_MS = 24 * 60 * 60 * 1000

const mediaIntentArgs = {
  usage: v.string(),
  kind: v.string(),
  mimeType: v.string(),
  byteSize: v.number(),
  sourceUrl: v.optional(v.string())
}

function cleanMediaIntent(args: {
  usage: string
  kind: string
  mimeType: string
  byteSize: number
  sourceUrl?: string
}) {
  const input = {
    usage: args.usage as RequestMediaUploadInput["usage"],
    kind: args.kind as RequestMediaUploadInput["kind"],
    mimeType: args.mimeType,
    byteSize: args.byteSize,
    sourceUrl: args.sourceUrl
  }

  try {
    validateMediaUploadIntent(input)
  } catch (error) {
    if (error instanceof MediaValidationError) {
      throw new ConvexError({ code: error.code, message: error.message })
    }

    throw error
  }

  return input as RequestMediaUploadInput & {
    usage: MediaAssetUsage
    kind: MediaAssetKind
  }
}

export const requestUpload = mutation({
  args: mediaIntentArgs,
  handler: async (ctx, args) => {
    await requireOwner(ctx)
    cleanMediaIntent(args)

    return {
      uploadUrl: await ctx.storage.generateUploadUrl()
    }
  }
})

export const finalizeUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    ...mediaIntentArgs
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const intent = cleanMediaIntent(args)
    const stored = await ctx.db.system.get(args.storageId)

    if (!stored) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Uploaded file is not available."
      })
    }

    if (stored.size !== intent.byteSize) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Uploaded file size does not match."
      })
    }

    if (stored.contentType && stored.contentType !== intent.mimeType) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Uploaded file type does not match."
      })
    }

    const now = Date.now()
    const assetId = await ctx.db.insert("mediaAssets", {
      ownerId,
      storageId: args.storageId,
      kind: intent.kind,
      mimeType: intent.mimeType,
      byteSize: intent.byteSize,
      status: "available",
      usage: intent.usage,
      sourceUrl: intent.sourceUrl,
      createdAt: now,
      updatedAt: now
    })

    return { assetId }
  }
})

export const getAssetUrl = query({
  args: {
    assetId: v.id("mediaAssets")
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const asset = await ctx.db.get(args.assetId)

    if (
      !asset ||
      asset.ownerId !== ownerId ||
      asset.status !== "available" ||
      !asset.storageId
    ) {
      return null
    }

    const url = await ctx.storage.getUrl(asset.storageId)

    if (!url) return null

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
      url
    }
  }
})

export const getAssetUrls = query({
  args: {
    assetIds: v.array(v.id("mediaAssets"))
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const result: Record<string, string> = {}

    for (const assetId of args.assetIds) {
      const asset = await ctx.db.get(assetId)

      if (
        !asset ||
        asset.ownerId !== ownerId ||
        asset.status !== "available" ||
        !asset.storageId
      ) {
        continue
      }

      const url = await ctx.storage.getUrl(asset.storageId)
      if (url) result[asset._id] = url
    }

    return result
  }
})

export const cleanupPending = mutation({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const now = Date.now()
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100)
    const assets = await ctx.db
      .query("mediaAssets")
      .withIndex("by_owner_status_cleanupAfter", (q) =>
        q.eq("ownerId", ownerId).eq("status", "pendingCleanup")
      )
      .take(limit)
    let deleted = 0

    for (const asset of assets) {
      if ((asset.cleanupAfter ?? 0) > now) continue
      if (await isAssetReferenced(ctx, ownerId, asset._id)) continue

      if (asset.storageId) {
        await ctx.storage.delete(asset.storageId)
      }

      await ctx.db.patch(asset._id, {
        status: "deleted",
        updatedAt: now
      })
      deleted += 1
    }

    return { deleted }
  }
})

export async function createAvailableMediaAsset(
  ctx: MutationCtx,
  args: {
    ownerId: string
    storageId: Id<"_storage">
    kind: MediaAssetKind
    mimeType: string
    byteSize: number
    usage: MediaAssetUsage
    sourceUrl?: string
    now?: number
  }
) {
  const now = args.now ?? Date.now()

  return await ctx.db.insert("mediaAssets", {
    ownerId: args.ownerId,
    storageId: args.storageId,
    kind: args.kind,
    mimeType: args.mimeType,
    byteSize: args.byteSize,
    status: "available",
    usage: args.usage,
    sourceUrl: args.sourceUrl,
    createdAt: now,
    updatedAt: now
  })
}

export async function markAssetsForCleanup(
  ctx: MutationCtx,
  ownerId: string,
  assetIds: Array<Id<"mediaAssets"> | undefined>,
  now = Date.now()
) {
  const uniqueIds = Array.from(
    new Set(assetIds.filter((id): id is Id<"mediaAssets"> => Boolean(id)))
  )

  for (const assetId of uniqueIds) {
    const asset = await ctx.db.get(assetId)

    if (!asset || asset.ownerId !== ownerId || asset.status !== "available") {
      continue
    }

    if (await isAssetReferenced(ctx, ownerId, assetId)) {
      continue
    }

    await ctx.db.patch(assetId, {
      status: "pendingCleanup",
      cleanupAfter: now + CLEANUP_DELAY_MS,
      updatedAt: now
    })
  }
}

export function mediaAssetIdsFromContent(
  ctx: QueryCtx | MutationCtx,
  content: string
) {
  return extractNoteMediaAssetIds(content)
    .map((id) => ctx.db.normalizeId("mediaAssets", id))
    .filter((id): id is Id<"mediaAssets"> => Boolean(id))
}

async function isAssetReferenced(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  assetId: Id<"mediaAssets">
) {
  const directReference = await ctx.db
    .query("inspirations")
    .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
    .filter((q) =>
      q.or(
        q.eq(q.field("primaryAssetId"), assetId),
        q.eq(q.field("mediaStatus"), "available")
      )
    )
    .first()

  if (directReference?.primaryAssetId === assetId) {
    return true
  }

  const snapshots = await ctx.db
    .query("pageSnapshots")
    .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
    .collect()

  if (
    snapshots.some(
      (snapshot) =>
        snapshot.htmlAssetId === assetId || snapshot.previewAssetId === assetId
    )
  ) {
    return true
  }

  const rows = await ctx.db
    .query("inspirations")
    .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
    .collect()

  return rows.some((row) =>
    mediaAssetIdsFromContent(ctx, row.content).some((id) => id === assetId)
  )
}
