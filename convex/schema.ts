import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

/**
 * All content kinds share one table so the Web app can list them together.
 * Capture only writes page / image / quote; note comes from the Web editor and
 * video is reserved for the media change.
 */
const inspirationType = v.union(
  v.literal("page"),
  v.literal("image"),
  v.literal("quote"),
  v.literal("note"),
  v.literal("video")
)

export default defineSchema({
  inspirations: defineTable({
    ownerId: v.string(),
    type: inspirationType,
    title: v.optional(v.string()),
    content: v.string(),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
    workspaceId: v.optional(v.string()),
    // Capture-only fields, absent on notes. `imageUrl` keeps the remote address
    // until media transfer exists (D04).
    sourceUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    selectedText: v.optional(v.string()),
    capturedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_owner_createdAt", ["ownerId", "createdAt"])
    .index("by_owner_workspace_createdAt", [
      "ownerId",
      "workspaceId",
      "createdAt"
    ]),
  /**
   * Result of a capture request id, so a transport retry returns the same
   * content instead of writing twice. Convex indexes are not unique: the
   * mutation reads this index first and relies on serializable transaction
   * retries to keep (ownerId, clientRequestId) to a single row (T02).
   * Only succeeded attempts are stored, so failures stay retryable.
   */
  captureAttempts: defineTable({
    ownerId: v.string(),
    clientRequestId: v.string(),
    payloadHash: v.string(),
    status: v.literal("succeeded"),
    inspirationId: v.id("inspirations"),
    createdAt: v.number()
  }).index("by_owner_clientRequestId", ["ownerId", "clientRequestId"]),
  workspaces: defineTable({
    ownerId: v.string(),
    name: v.string(),
    nameKey: v.string(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_owner_createdAt", ["ownerId", "createdAt"])
    .index("by_owner_nameKey", ["ownerId", "nameKey"]),
  userInitializations: defineTable({
    ownerId: v.string(),
    starterNotesSeededAt: v.optional(v.number()),
    starterNotesVersion: v.optional(v.number())
  }).index("by_owner", ["ownerId"])
})
