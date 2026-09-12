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

describe("captures.capture", () => {
  test("首次请求创建 page 内容并返回 created: true", async () => {
    const t = convexTest(schema, modules)
    const result = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, pageRequest)

    expect(result.created).toBe(true)

    const row = await t.run(async (ctx) => ctx.db.get(result.inspirationId))

    expect(row?.type).toBe("page")
    expect(row?.ownerId).toBe(owner.subject)
    expect(row?.title).toBe("示例文章")
    expect(row?.content).toBe("https://example.com/article")
    expect(row?.sourceUrl).toBe("https://example.com/article")
    expect(row?.tags).toEqual([])
  })

  test("quote 与 image 分别落到各自的列", async () => {
    const t = convexTest(schema, modules)

    const quote = await t.withIdentity(owner).mutation(api.captures.capture, {
      clientRequestId: "req-quote-1",
      kind: "quote",
      sourceUrl: "https://example.com/article",
      selectedText: "被引用的句子"
    })
    const quoteRow = await t.run(async (ctx) => ctx.db.get(quote.inspirationId))

    expect(quoteRow?.type).toBe("quote")
    expect(quoteRow?.content).toBe("被引用的句子")
    expect(quoteRow?.selectedText).toBe("被引用的句子")

    const image = await t.withIdentity(owner).mutation(api.captures.capture, {
      clientRequestId: "req-image-1",
      kind: "image",
      sourceUrl: "https://example.com/article",
      imageUrl: "https://cdn.example.com/a.png"
    })
    const imageRow = await t.run(async (ctx) => ctx.db.get(image.inspirationId))

    expect(imageRow?.type).toBe("image")
    expect(imageRow?.imageUrl).toBe("https://cdn.example.com/a.png")
  })

  test("同 id 同载荷重试返回同一内容且只写一行", async () => {
    const t = convexTest(schema, modules)

    const first = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, pageRequest)
    const retry = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, pageRequest)

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

    await t.withIdentity(owner).mutation(api.captures.capture, pageRequest)

    await expect(
      t.withIdentity(owner).mutation(api.captures.capture, {
        ...pageRequest,
        pageTitle: "换了一个标题"
      })
    ).rejects.toThrow(/already used for different content/)

    const rows = await t.run(async (ctx) =>
      ctx.db.query("inspirations").collect()
    )

    expect(rows).toHaveLength(1)
  })

  test("主动再次保存使用新 id 时创建第二条内容", async () => {
    const t = convexTest(schema, modules)

    await t.withIdentity(owner).mutation(api.captures.capture, pageRequest)
    const second = await t.withIdentity(owner).mutation(api.captures.capture, {
      ...pageRequest,
      clientRequestId: "req-page-2"
    })

    expect(second.created).toBe(true)

    const rows = await t.run(async (ctx) =>
      ctx.db.query("inspirations").collect()
    )

    expect(rows).toHaveLength(2)
  })

  test("未登录抛 UNAUTHENTICATED", async () => {
    const t = convexTest(schema, modules)

    await expect(t.mutation(api.captures.capture, pageRequest)).rejects.toThrow(
      /Login is required/
    )
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
        ...pageRequest,
        workspaceId: "not-a-workspace-id"
      })
    ).rejects.toThrow(/Workspace is not available/)
  })

  test("另一账户读不到该采集内容", async () => {
    const t = convexTest(schema, modules)
    const result = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, pageRequest)

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

describe("captures.updateDetails", () => {
  test("page 采集把 description 存为正文并保留封面地址", async () => {
    const t = convexTest(schema, modules)
    const result = await t.withIdentity(owner).mutation(api.captures.capture, {
      clientRequestId: "req-page-desc",
      kind: "page",
      sourceUrl: "https://example.com/article",
      pageTitle: "示例文章",
      description: "一段页面摘要",
      imageUrl: "https://cdn.example.com/cover.png"
    })
    const row = await t.run(async (ctx) => ctx.db.get(result.inspirationId))

    expect(row?.content).toBe("一段页面摘要")
    expect(row?.imageUrl).toBe("https://cdn.example.com/cover.png")
  })

  test("只更新 tags 与备注，正文与来源不变", async () => {
    const t = convexTest(schema, modules)
    const created = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, pageRequest)

    await t.withIdentity(owner).mutation(api.captures.updateDetails, {
      id: created.inspirationId,
      tags: ["阅读", "设计"],
      note: "稍后读"
    })

    const row = await t.run(async (ctx) => ctx.db.get(created.inspirationId))

    expect(row?.tags).toEqual(["阅读", "设计"])
    expect(row?.notes).toBe("稍后读")
    expect(row?.content).toBe("https://example.com/article")
  })

  test("另一账户不能改他人采集内容", async () => {
    const t = convexTest(schema, modules)
    const created = await t
      .withIdentity(owner)
      .mutation(api.captures.capture, pageRequest)

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
