import { ConvexError, v } from "convex/values"

import { isCaptureKind } from "../packages/contracts/src/index"
import { mutation } from "./_generated/server"
import { requireOwner } from "./lib/auth"
import {
  buildCaptureColumns,
  buildCapturePayload,
  captureArgs,
  cleanCapture,
  cleanCaptureDetails,
  hashCapturePayload,
  resolveCaptureWorkspaceId
} from "./lib/captures"
import { touchWorkspace } from "./lib/workspaces"

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

    const workspaceId = await resolveCaptureWorkspaceId(
      ctx,
      ownerId,
      request.workspaceId
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
      workspaceId,
      sourceUrl: columns.sourceUrl,
      imageUrl: columns.imageUrl,
      selectedText: columns.selectedText,
      capturedAt: request.capturedAt ?? now,
      createdAt: now,
      updatedAt: now
    })

    // Written in the same transaction as the content. A concurrent retry of the
    // same id is caught by Convex' serializable retry, which then reads this row
    // and returns the same content instead of inserting a second one (T02).
    await ctx.db.insert("captureAttempts", {
      ownerId,
      clientRequestId: request.clientRequestId,
      payloadHash,
      status: "succeeded",
      inspirationId,
      createdAt: now
    })

    await touchWorkspace(ctx, workspaceId)

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
