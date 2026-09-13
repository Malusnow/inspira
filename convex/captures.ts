import type { FunctionReference } from "convex/server"
import { ConvexError, v } from "convex/values"

import {
  isCaptureKind,
  MEDIA_IMAGE_MAX_BYTES,
  MediaValidationError,
  validateMediaUploadIntent
} from "../packages/contracts/src/index"
import type { Id } from "./_generated/dataModel"
import {
  action,
  internalMutation,
  internalQuery,
  mutation
} from "./_generated/server"
import { requireOwner } from "./lib/auth"
import {
  buildCaptureColumns,
  buildCapturePayload,
  captureArgs,
  cleanCapture,
  cleanCaptureDetails,
  hashCapturePayload,
  resolveCaptureWorkspaceIds
} from "./lib/captures"
import {
  ensureWorkspaceMemberships,
  touchWorkspaces
} from "./lib/workspaces"
import { createAvailableMediaAsset } from "./media"

const getCaptureAttemptResultRef =
  "captures:getCaptureAttemptResult" as unknown as FunctionReference<
    "query",
    "internal",
    { ownerId: string; clientRequestId: string },
    {
      payloadHash: string
      inspirationId: Id<"inspirations">
    } | null
  >

const createManagedCaptureRef =
  "captures:createManagedCapture" as unknown as FunctionReference<
    "mutation",
    "internal",
    {
      clientRequestId: string
      kind: string
      sourceUrl?: string
      pageTitle?: string
      description?: string
      selectedText?: string
      imageUrl?: string
      snapshotHtml?: string
      note?: string
      workspaceIds?: string[]
      workspaceId?: string
      tags?: string[]
      capturedAt?: number
      ownerId: string
      payloadHash: string
      storageId: Id<"_storage">
      storedMimeType: string
      storedByteSize: number
    },
    { inspirationId: Id<"inspirations">; created: boolean }
  >

function sourceUnavailable(message: string) {
  return new ConvexError({
    code: "SOURCE_UNAVAILABLE",
    message
  })
}

function validateManagedCaptureMedia(
  input: Parameters<typeof validateMediaUploadIntent>[0]
) {
  try {
    validateMediaUploadIntent(input)
  } catch (error) {
    if (error instanceof MediaValidationError) {
      throw sourceUnavailable(error.message)
    }

    throw error
  }
}

/**
 * Saves one capture (page / quote / image) for the signed-in owner.
 *
 * Idempotency: a retried request id with the same payload returns the recorded
 * content with `created: false`; the same id with a different payload is a
 * client bug and returns `REQUEST_CONFLICT`. A deliberate second capture is a
 * new request id and therefore always writes new content — captures are never
 * deduplicated by URL, image address or text.
 */
export const capture = mutation({
  args: captureArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const request = cleanCapture(args)

    if (request.kind !== "quote") {
      throw sourceUnavailable(
        "Page and image captures require the managed capture endpoint."
      )
    }

    const payloadHash = await hashCapturePayload(buildCapturePayload(request))
    const existingAttempt = await ctx.db
      .query("captureAttempts")
      .withIndex("by_owner_clientRequestId", (q) =>
        q.eq("ownerId", ownerId).eq("clientRequestId", request.clientRequestId)
      )
      .first()

    if (existingAttempt) {
      if (existingAttempt.payloadHash !== payloadHash) {
        throw new ConvexError({
          code: "REQUEST_CONFLICT",
          message: "This request id was already used for different content."
        })
      }

      return {
        inspirationId: existingAttempt.inspirationId,
        created: false
      }
    }

    const workspaceIds = await resolveCaptureWorkspaceIds(
      ctx,
      ownerId,
      request.workspaceIds
    )
    const columns = buildCaptureColumns(request)
    const now = Date.now()
    const inspirationId = await ctx.db.insert("inspirations", {
      ownerId,
      type: request.kind,
      title: columns.title,
      content: columns.content,
      notes: request.note,
      tags: request.tags,
      sourceUrl: columns.sourceUrl,
      selectedText: columns.selectedText,
      capturedAt: request.capturedAt ?? now,
      createdAt: now,
      updatedAt: now
    })

    // Written in the same transaction as the content. A concurrent retry of the
    // same id is caught by Convex' serializable retry, which then reads this row
    // and returns the same content instead of inserting a second one (T02). The
    // early return above means a retry never inserts a second membership either.
    await ensureWorkspaceMemberships(ctx, ownerId, inspirationId, workspaceIds)

    await ctx.db.insert("captureAttempts", {
      ownerId,
      clientRequestId: request.clientRequestId,
      payloadHash,
      status: "succeeded",
      inspirationId,
      createdAt: now
    })

    await touchWorkspaces(ctx, workspaceIds)

    return { inspirationId, created: true }
  }
})

export const captureManaged = action({
  args: captureArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const request = cleanCapture(args)

    if (request.kind !== "page" && request.kind !== "image") {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Managed capture supports page and image only."
      })
    }

    const payloadHash = await hashCapturePayload(buildCapturePayload(request))
    const existing = await ctx.runQuery(getCaptureAttemptResultRef, {
      ownerId,
      clientRequestId: request.clientRequestId
    })

    if (existing) {
      if (existing.payloadHash !== payloadHash) {
        throw new ConvexError({
          code: "REQUEST_CONFLICT",
          message: "This request id was already used for different content."
        })
      }

      return {
        inspirationId: existing.inspirationId,
        created: false
      }
    }

    let stored: {
      storageId: Id<"_storage">
      mimeType: string
      byteSize: number
    }

    if (request.kind === "page") {
      if (!request.snapshotHtml) {
        throw sourceUnavailable("Page snapshot is not available.")
      }

      const byteSize = new TextEncoder().encode(request.snapshotHtml).byteLength

      validateManagedCaptureMedia({
        kind: "pageHtml",
        usage: "pageSnapshotHtml",
        mimeType: "text/html",
        byteSize,
        sourceUrl: request.sourceUrl
      })

      const blob = new Blob([request.snapshotHtml], { type: "text/html" })
      stored = {
        storageId: await ctx.storage.store(blob),
        mimeType: "text/html",
        byteSize
      }
    } else {
      if (!request.imageUrl) {
        throw sourceUnavailable("Image URL is not available.")
      }

      let response: Response

      try {
        response = await fetch(request.imageUrl)
      } catch {
        throw sourceUnavailable("Image could not be fetched.")
      }

      if (!response.ok) {
        throw sourceUnavailable("Image could not be fetched.")
      }

      const mimeType = response.headers.get("content-type")?.split(";")[0] ?? ""
      const blob = await response.blob()

      validateManagedCaptureMedia({
        kind: "image",
        usage: "captureImage",
        mimeType,
        byteSize: blob.size,
        sourceUrl: request.imageUrl
      })

      if (blob.size > MEDIA_IMAGE_MAX_BYTES) {
        throw sourceUnavailable("Image is too large.")
      }

      stored = {
        storageId: await ctx.storage.store(blob),
        mimeType,
        byteSize: blob.size
      }
    }

    return await ctx.runMutation(createManagedCaptureRef, {
      ...args,
      ownerId,
      payloadHash,
      storageId: stored.storageId,
      storedMimeType: stored.mimeType,
      storedByteSize: stored.byteSize
    })
  }
})

export const getCaptureAttemptResult = internalQuery({
  args: {
    ownerId: v.string(),
    clientRequestId: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("captureAttempts")
      .withIndex("by_owner_clientRequestId", (q) =>
        q
          .eq("ownerId", args.ownerId)
          .eq("clientRequestId", args.clientRequestId)
      )
      .first()
  }
})

export const createManagedCapture = internalMutation({
  args: {
    ...captureArgs,
    ownerId: v.string(),
    payloadHash: v.string(),
    storageId: v.id("_storage"),
    storedMimeType: v.string(),
    storedByteSize: v.number()
  },
  handler: async (ctx, args) => {
    const request = cleanCapture(args)
    const existingAttempt = await ctx.db
      .query("captureAttempts")
      .withIndex("by_owner_clientRequestId", (q) =>
        q
          .eq("ownerId", args.ownerId)
          .eq("clientRequestId", request.clientRequestId)
      )
      .first()

    if (existingAttempt) {
      if (existingAttempt.payloadHash !== args.payloadHash) {
        throw new ConvexError({
          code: "REQUEST_CONFLICT",
          message: "This request id was already used for different content."
        })
      }

      return {
        inspirationId: existingAttempt.inspirationId,
        created: false
      }
    }

    const workspaceIds = await resolveCaptureWorkspaceIds(
      ctx,
      args.ownerId,
      request.workspaceIds
    )
    const columns = buildCaptureColumns(request)
    const now = Date.now()
    const assetId = await createAvailableMediaAsset(ctx, {
      ownerId: args.ownerId,
      storageId: args.storageId,
      kind: request.kind === "page" ? "pageHtml" : "image",
      usage: request.kind === "page" ? "pageSnapshotHtml" : "captureImage",
      mimeType: args.storedMimeType,
      byteSize: args.storedByteSize,
      sourceUrl: request.kind === "page" ? request.sourceUrl : request.imageUrl,
      now
    })
    const inspirationId = await ctx.db.insert("inspirations", {
      ownerId: args.ownerId,
      type: request.kind,
      title: columns.title,
      content: columns.content,
      notes: request.note,
      tags: request.tags,
      sourceUrl: columns.sourceUrl,
      primaryAssetId: request.kind === "image" ? assetId : undefined,
      mediaStatus: "available",
      selectedText: columns.selectedText,
      capturedAt: request.capturedAt ?? now,
      createdAt: now,
      updatedAt: now
    })

    await ensureWorkspaceMemberships(
      ctx,
      args.ownerId,
      inspirationId,
      workspaceIds
    )

    if (request.kind === "page") {
      const snapshotId = await ctx.db.insert("pageSnapshots", {
        ownerId: args.ownerId,
        inspirationId,
        htmlAssetId: assetId,
        originalUrl: request.sourceUrl ?? "",
        capturedAt: request.capturedAt ?? now,
        createdAt: now
      })

      await ctx.db.patch(inspirationId, {
        pageSnapshotId: snapshotId
      })
    }

    await ctx.db.insert("captureAttempts", {
      ownerId: args.ownerId,
      clientRequestId: request.clientRequestId,
      payloadHash: args.payloadHash,
      status: "succeeded",
      inspirationId,
      createdAt: now
    })

    await touchWorkspaces(ctx, workspaceIds)

    return { inspirationId, created: true }
  }
})

/**
 * Applies the popup's tags / remark edit to a captured item. Only capture kinds
 * are editable here; notes keep using `notes.update`, which also owns title,
 * content and workspace. `undefined` fields stay unchanged.
 */
export const updateDetails = mutation({
  args: {
    id: v.id("inspirations"),
    tags: v.optional(v.array(v.string())),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const existing = await ctx.db.get(args.id)

    if (!existing || existing.ownerId !== ownerId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Capture is not available."
      })
    }

    if (!isCaptureKind(existing.type)) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Only captures can be updated here."
      })
    }

    const details = cleanCaptureDetails(args)

    await ctx.db.patch(args.id, {
      ...(details.tags === undefined ? {} : { tags: details.tags }),
      ...(details.notes === undefined ? {} : { notes: details.notes }),
      updatedAt: Date.now()
    })

    return args.id
  }
})
