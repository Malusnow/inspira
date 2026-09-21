// @vitest-environment edge-runtime
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")
const owner = { subject: "user-inspiration-owner" }
const other = { subject: "user-inspiration-other" }

describe("inspirations.listMine pagination", () => {
  test("returns stable owner-scoped pages in newest-first order", async () => {
    const t = convexTest(schema, modules)

    await t.run(async (ctx) => {
      for (let index = 0; index < 35; index += 1) {
        await ctx.db.insert("inspirations", {
          ownerId: owner.subject,
          type: "note",
          content: `owner item ${index}`,
          tags: [],
          createdAt: index,
          updatedAt: index
        })
      }

      await ctx.db.insert("inspirations", {
        ownerId: other.subject,
        type: "note",
        content: "other owner item",
        tags: [],
        createdAt: 100,
        updatedAt: 100
      })
    })

    const first = await t.withIdentity(owner).query(api.inspirations.listMine, {
      paginationOpts: { numItems: 20, cursor: null }
    })
    const second = await t
      .withIdentity(owner)
      .query(api.inspirations.listMine, {
        paginationOpts: { numItems: 20, cursor: first.continueCursor }
      })
    const contents = [...first.page, ...second.page].map((item) => item.content)

    expect(first.isDone).toBe(false)
    expect(second.isDone).toBe(true)
    expect(contents).toHaveLength(35)
    expect(new Set(contents).size).toBe(35)
    expect(contents[0]).toBe("owner item 34")
    expect(contents.at(-1)).toBe("owner item 0")
    expect(contents).not.toContain("other owner item")
  })
})
