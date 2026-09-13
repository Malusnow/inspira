// @vitest-environment edge-runtime
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { createNoteMediaReference } from "../packages/contracts/src/index"
import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

const owner = { subject: "user-media-owner" }
const otherOwner = { subject: "user-media-other" }

async function storeTestImage(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    return await ctx.storage.store(new Blob(["image"], { type: "image/png" }))
  })
}

describe("media managed assets", () => {
  test("finalize creates owner-scoped asset and cross-owner URL access is denied", async () => {
    const t = convexTest(schema, modules)
    const storageId = await storeTestImage(t)
    const finalized = await t
      .withIdentity(owner)
      .mutation(api.media.finalizeUpload, {
        storageId,
        kind: "noteImage",
        usage: "noteEmbed",
        mimeType: "image/png",
        byteSize: 5
      })

    const ownerView = await t
      .withIdentity(owner)
      .query(api.media.getAssetUrl, { assetId: finalized.assetId })
    const otherView = await t
      .withIdentity(otherOwner)
      .query(api.media.getAssetUrl, { assetId: finalized.assetId })

    expect(ownerView?.id).toBe(finalized.assetId)
    expect(ownerView?.url).toBeTruthy()
    expect(otherView).toBeNull()
  })

  test("note cannot reference another owner's media asset", async () => {
    const t = convexTest(schema, modules)
    const storageId = await storeTestImage(t)
    const finalized = await t
      .withIdentity(owner)
      .mutation(api.media.finalizeUpload, {
        storageId,
        kind: "noteImage",
        usage: "noteEmbed",
        mimeType: "image/png",
        byteSize: 5
      })

    await expect(
      t.withIdentity(otherOwner).mutation(api.notes.create, {
        content: createNoteMediaReference(finalized.assetId),
        tags: []
      })
    ).rejects.toThrow(/Note media is not available/)
  })

  test("deleted note queues unreferenced embedded media for cleanup", async () => {
    const t = convexTest(schema, modules)
    const storageId = await storeTestImage(t)
    const finalized = await t
      .withIdentity(owner)
      .mutation(api.media.finalizeUpload, {
        storageId,
        kind: "noteImage",
        usage: "noteEmbed",
        mimeType: "image/png",
        byteSize: 5
      })
    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: createNoteMediaReference(finalized.assetId),
      tags: []
    })

    await t.withIdentity(owner).mutation(api.notes.remove, { id: noteId })

    const pending = await t.run(async (ctx) => {
      const asset = await ctx.db.get(finalized.assetId)
      if (!asset) return null
      await ctx.db.patch(asset._id, { cleanupAfter: 0 })
      return await ctx.db.get(asset._id)
    })

    expect(pending?.status).toBe("pendingCleanup")

    const result = await t
      .withIdentity(owner)
      .mutation(api.media.cleanupPending, { limit: 10 })
    const deleted = await t.run(async (ctx) => ctx.db.get(finalized.assetId))

    expect(result.deleted).toBe(1)
    expect(deleted?.status).toBe("deleted")
  })
})
