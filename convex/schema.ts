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

const mediaAssetKind = v.union(
  v.literal("image"),
  v.literal("pageHtml"),
  v.literal("pagePreview"),
  v.literal("noteImage")
)

const mediaAssetUsage = v.union(
  v.literal("captureImage"),
  v.literal("pageSnapshotHtml"),
  v.literal("pageSnapshotPreview"),
  v.literal("noteEmbed")
)

const mediaAssetStatus = v.union(
  v.literal("uploading"),
  v.literal("available"),
  v.literal("failed"),
  v.literal("pendingCleanup"),
  v.literal("deleted")
)

export default defineSchema({
  inspirations: defineTable({
    ownerId: v.string(),
    type: inspirationType,
    title: v.optional(v.string()),
    content: v.string(),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
    // Capture-only fields, absent on notes. Rendering uses managed media.
    sourceUrl: v.optional(v.string()),
    primaryAssetId: v.optional(v.id("mediaAssets")),
    pageSnapshotId: v.optional(v.id("pageSnapshots")),
    mediaStatus: v.optional(mediaAssetStatus),
    selectedText: v.optional(v.string()),
    capturedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_owner_createdAt", ["ownerId", "createdAt"]),
  mediaAssets: defineTable({
    ownerId: v.string(),
    storageId: v.optional(v.id("_storage")),
    kind: mediaAssetKind,
    mimeType: v.string(),
    byteSize: v.number(),
    status: mediaAssetStatus,
    usage: mediaAssetUsage,
    sourceUrl: v.optional(v.string()),
    cleanupAfter: v.optional(v.number()),
    failureCode: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_owner_createdAt", ["ownerId", "createdAt"])
    .index("by_owner_status_cleanupAfter", [
      "ownerId",
      "status",
      "cleanupAfter"
    ]),
  pageSnapshots: defineTable({
    ownerId: v.string(),
    inspirationId: v.id("inspirations"),
    htmlAssetId: v.id("mediaAssets"),
    previewAssetId: v.optional(v.id("mediaAssets")),
    originalUrl: v.string(),
    capturedAt: v.number(),
    createdAt: v.number()
  })
    .index("by_owner_inspiration", ["ownerId", "inspirationId"])
    .index("by_owner_createdAt", ["ownerId", "createdAt"]),
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
  /**
   * Join table for the 0..N workspaces an inspiration belongs to. Persisting a
   * single `inspirations.workspaceId` was replaced by this table so one item can
   * live in several workspaces without duplicating content. `ownerId` is
   * denormalized here so every read can carry the owner prefix and never has to
   * resolve ownership through `inspirations`. Convex indexes are not unique: the
   * helpers read before writing and rely on serializable transaction retries to
   * keep (ownerId, inspirationId, workspaceId) to a single row.
   */
  workspaceMemberships: defineTable({
    ownerId: v.string(),
    inspirationId: v.id("inspirations"),
    workspaceId: v.id("workspaces"),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_owner_workspace_createdAt", [
      "ownerId",
      "workspaceId",
      "createdAt"
    ])
    .index("by_owner_inspiration", ["ownerId", "inspirationId"])
    .index("by_owner_inspiration_workspace", [
      "ownerId",
      "inspirationId",
      "workspaceId"
    ]),
  userInitializations: defineTable({
    ownerId: v.string(),
    starterNotesSeededAt: v.optional(v.number()),
    starterNotesVersion: v.optional(v.number())
  }).index("by_owner", ["ownerId"])
})
