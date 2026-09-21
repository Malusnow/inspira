import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { mediaAssetIdsFromContent } from "../media"
import { toInspiration } from "./notes"
import { listWorkspaceIdsForInspiration } from "./workspaces"

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

/** Builds the owner-scoped card/detail read model shared by every feed. */
export async function hydrateInspiration(
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
