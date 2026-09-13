// @vitest-environment edge-runtime
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

const owner = { subject: "user-capture-owner" }
const otherOwner = { subject: "user-capture-other" }

const pageRequest = {
  clientRequestId: "req-page-1",
  kind: "page",
  sourceUrl: "https://example.com/article",
  pageTitle: "示例文章"
}

const quoteRequest = {
  clientRequestId: "req-quote-1",
  kind: "quote",
  sourceUrl: "https://example.com/article",
  pageTitle: "示例文章",
  selectedText: "被引用的句子"
}

describe("captures.capture", () => {
  test("首次请求创建 quote 内容并返回 created: true", async () => {
    const t = convexTest(schema, modules)
    const result = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, quoteRequest)

    expect(result.created).toBe(true)

    const row = await t.run(async (ctx) => ctx.db.get(result.inspirationId))

    expect(row?.type).toBe("quote")
    expect(row?.ownerId).toBe(owner.subject)
    expect(row?.title).toBe("示例文章")
    expect(row?.content).toBe("被引用的句子")
    expect(row?.sourceUrl).toBe("https://example.com/article")
    expect(row?.selectedText).toBe("被引用的句子")
    expect(row?.tags).toEqual([])
  })

  test("page 与 image 不能走旧 capture mutation 静默保存", async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.withIdentity(owner).mutation(api.captures.capture, pageRequest)
    ).rejects.toThrow(/managed capture endpoint/)

    await expect(
      t.withIdentity(owner).mutation(api.captures.capture, {
        clientRequestId: "req-image-1",
        kind: "image",
        sourceUrl: "https://example.com/article",
        imageUrl: "https://cdn.example.com/a.png"
      })
    ).rejects.toThrow(/managed capture endpoint/)
  })

  test("同 id 同载荷重试返回同一内容且只写一行", async () => {
    const t = convexTest(schema, modules)

    const first = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, quoteRequest)
    const retry = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, quoteRequest)

    expect(first.created).toBe(true)
    expect(retry.created).toBe(false)
    expect(retry.inspirationId).toBe(first.inspirationId)

    const rows = await t.run(async (ctx) =>
      ctx.db.query("inspirations").collect()
    )

    expect(rows).toHaveLength(1)
  })

  test("同 id 不同载荷抛 REQUEST_CONFLICT 且不新增内容", async () => {
    const t = convexTest(schema, modules)

    await t.withIdentity(owner).mutation(api.captures.capture, quoteRequest)

    await expect(
      t.withIdentity(owner).mutation(api.captures.capture, {
        ...quoteRequest,
        selectedText: "换了一段引用"
      })
    ).rejects.toThrow(/already used for different content/)

    const rows = await t.run(async (ctx) =>
      ctx.db.query("inspirations").collect()
    )

    expect(rows).toHaveLength(1)
  })

  test("主动再次保存使用新 id 时创建第二条内容", async () => {
    const t = convexTest(schema, modules)

    await t.withIdentity(owner).mutation(api.captures.capture, quoteRequest)
    const second = await t.withIdentity(owner).mutation(api.captures.capture, {
      ...quoteRequest,
      clientRequestId: "req-quote-2"
    })

    expect(second.created).toBe(true)

    const rows = await t.run(async (ctx) =>
      ctx.db.query("inspirations").collect()
    )

    expect(rows).toHaveLength(2)
  })

  test("未登录抛 UNAUTHENTICATED", async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.mutation(api.captures.capture, quoteRequest)
    ).rejects.toThrow(/Login is required/)
  })

  test("非法输入抛 INVALID_INPUT", async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.withIdentity(owner).mutation(api.captures.capture, {
        clientRequestId: "req-bad-1",
        kind: "note",
        sourceUrl: "https://example.com/article"
      })
    ).rejects.toThrow(/kind must be one of/)

    await expect(
      t.withIdentity(owner).mutation(api.captures.capture, {
        clientRequestId: "req-bad-2",
        kind: "page"
      })
    ).rejects.toThrow(/sourceUrl is required/)
  })

  test("陌生 workspace 抛 WORKSPACE_UNAVAILABLE", async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.withIdentity(owner).mutation(api.captures.capture, {
        ...quoteRequest,
        workspaceId: "not-a-workspace-id"
      })
    ).rejects.toThrow(/Workspace is not available/)
  })

  test("另一账户读不到该采集内容", async () => {
    const t = convexTest(schema, modules)
    const result = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, quoteRequest)

    const ownerView = await t
      .withIdentity(owner)
      .query(api.notes.getMine, { id: result.inspirationId })
    const otherView = await t
      .withIdentity(otherOwner)
      .query(api.notes.getMine, { id: result.inspirationId })

    expect(ownerView).not.toBeNull()
    expect(otherView).toBeNull()
  })
})

describe("captures.captureManaged", () => {
  test("page 保存成功时创建 HTML 媒体资产和 pageSnapshots 引用", async () => {
    const t = convexTest(schema, modules)
    const result = await t
      .withIdentity(owner)
      .action(api.captures.captureManaged, {
        ...pageRequest,
        snapshotHtml:
          "<!doctype html><html><head></head><body>snapshot</body></html>"
      })

    expect(result.created).toBe(true)

    const state = await t.run(async (ctx) => {
      const inspiration = await ctx.db.get(result.inspirationId)
      const snapshot = inspiration?.pageSnapshotId
        ? await ctx.db.get(inspiration.pageSnapshotId)
        : null
      const htmlAsset = snapshot?.htmlAssetId
        ? await ctx.db.get(snapshot.htmlAssetId)
        : null

      return { inspiration, snapshot, htmlAsset }
    })

    expect(state.inspiration?.type).toBe("page")
    expect(state.inspiration?.pageSnapshotId).toBeTruthy()
    expect(state.inspiration?.primaryAssetId).toBeUndefined()
    expect(state.snapshot?.htmlAssetId).toBeTruthy()
    expect(state.htmlAsset?.kind).toBe("pageHtml")
    expect(state.htmlAsset?.usage).toBe("pageSnapshotHtml")
    expect(state.htmlAsset?.status).toBe("available")
    expect(state.htmlAsset?.storageId).toBeTruthy()
  })
})

describe("captures.updateDetails", () => {
  test("quote 采集把选中文字存为正文", async () => {
    const t = convexTest(schema, modules)
    const result = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, quoteRequest)
    const row = await t.run(async (ctx) => ctx.db.get(result.inspirationId))

    expect(row?.content).toBe("被引用的句子")
    expect(row?.selectedText).toBe("被引用的句子")
  })

  test("只更新 tags 与备注，正文与来源不变", async () => {
    const t = convexTest(schema, modules)
    const created = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, quoteRequest)

    await t.withIdentity(owner).mutation(api.captures.updateDetails, {
      id: created.inspirationId,
      tags: ["阅读", "设计"],
      note: "稍后读"
    })

    const row = await t.run(async (ctx) => ctx.db.get(created.inspirationId))

    expect(row?.tags).toEqual(["阅读", "设计"])
    expect(row?.notes).toBe("稍后读")
    expect(row?.content).toBe("被引用的句子")
  })

  test("另一账户不能改他人采集内容", async () => {
    const t = convexTest(schema, modules)
    const created = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, quoteRequest)

    await expect(
      t.withIdentity(otherOwner).mutation(api.captures.updateDetails, {
        id: created.inspirationId,
        tags: ["不该生效"]
      })
    ).rejects.toThrow(/Capture is not available/)

    const row = await t.run(async (ctx) => ctx.db.get(created.inspirationId))

    expect(row?.tags).toEqual([])
  })

  test("note 类型内容不能用采集入口更新", async () => {
    const t = convexTest(schema, modules)
    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "一条普通笔记",
      tags: ["note"]
    })

    await expect(
      t.withIdentity(owner).mutation(api.captures.updateDetails, {
        id: noteId,
        tags: ["不该生效"]
      })
    ).rejects.toThrow(/Only captures can be updated here/)
  })
})
