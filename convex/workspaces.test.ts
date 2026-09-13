// @vitest-environment edge-runtime
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

const owner = { subject: "user-workspaces-owner" }
const other = { subject: "user-workspaces-other" }

type TestConvex = ReturnType<typeof convexTest>

const sorted = (ids: readonly string[]) => [...ids].sort()

async function countMemberships(t: TestConvex) {
  return await t.run(
    async (ctx) => (await ctx.db.query("workspaceMemberships").collect()).length
  )
}

async function createWorkspace(t: TestConvex, name: string, identity = owner) {
  return await t.withIdentity(identity).mutation(api.workspaces.create, { name })
}

async function createNote(
  t: TestConvex,
  content: string,
  workspaceIds: string[],
  identity = owner
) {
  return await t.withIdentity(identity).mutation(api.notes.create, {
    content,
    workspaceIds
  })
}

async function readWorkspaceIds(t: TestConvex, noteId: Id<"inspirations">) {
  const note = await t.withIdentity(owner).query(api.notes.getMine, {
    id: noteId
  })

  return note?.workspaceIds ?? []
}

async function findWorkspace(t: TestConvex, name: string) {
  const list = await t.withIdentity(owner).query(api.workspaces.listMine, {})

  return list.find((workspace) => workspace.name === name)
}

describe("workspaces.listMine 的成员计数", () => {
  test("一条内容计入它所属的每个工作区，工作区内不重复", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")

    await createNote(t, "两个工作区都有的内容", [reading, design])
    await createNote(t, "只在阅读", [reading])

    const readingSummary = await findWorkspace(t, "阅读")
    const designSummary = await findWorkspace(t, "设计")

    expect(readingSummary?.itemCount).toBe(2)
    expect(designSummary?.itemCount).toBe(1)

    const previewIds = readingSummary?.preview.items.map((item) => item.id)
    expect(previewIds).toHaveLength(2)
    expect(new Set(previewIds).size).toBe(2)
  })

  test("preview 只取前 3 条，itemCount 反映全部", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")

    for (let index = 0; index < 4; index += 1) {
      await createNote(t, `内容 ${index}`, [reading])
    }

    const summary = await findWorkspace(t, "阅读")

    expect(summary?.itemCount).toBe(4)
    expect(summary?.preview.items).toHaveLength(3)
  })
})

describe("workspaces.setItemWorkspaces", () => {
  test("完整替换：勾选一个工作区不会把内容移出其他工作区", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")
    const noteId = await createNote(t, "两个工作区", [reading, design])

    await t.withIdentity(owner).mutation(api.workspaces.setItemWorkspaces, {
      inspirationId: noteId,
      workspaceIds: [reading]
    })

    expect(await readWorkspaceIds(t, noteId)).toEqual([reading])
    expect((await findWorkspace(t, "阅读"))?.itemCount).toBe(1)
    expect((await findWorkspace(t, "设计"))?.itemCount).toBe(0)
  })

  test("传空数组只清空归属，内容保留在 All", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const noteId = await createNote(t, "移出工作区", [reading])

    await t.withIdentity(owner).mutation(api.workspaces.setItemWorkspaces, {
      inspirationId: noteId,
      workspaceIds: []
    })

    expect(await readWorkspaceIds(t, noteId)).toEqual([])
    expect(await countMemberships(t)).toBe(0)

    const list = await t.withIdentity(owner).query(api.notes.listMine, {})
    expect(list.map((note) => note.id)).toContain(noteId)
  })

  test("重复提交同一集合不产生重复成员行", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const noteId = await createNote(t, "可重试", [])

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await t.withIdentity(owner).mutation(api.workspaces.setItemWorkspaces, {
        inspirationId: noteId,
        workspaceIds: [reading]
      })
    }

    expect(await readWorkspaceIds(t, noteId)).toEqual([reading])
    expect(await countMemberships(t)).toBe(1)
    expect((await findWorkspace(t, "阅读"))?.itemCount).toBe(1)
  })

  test("包含他人工区时整体拒绝且归属不变", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const othersWorkspace = await createWorkspace(t, "别人的工作区", other)
    const noteId = await createNote(t, "原有归属", [reading])

    await expect(
      t.withIdentity(owner).mutation(api.workspaces.setItemWorkspaces, {
        inspirationId: noteId,
        workspaceIds: [reading, othersWorkspace]
      })
    ).rejects.toThrow("Workspace is not available.")

    expect(await readWorkspaceIds(t, noteId)).toEqual([reading])
    expect(await countMemberships(t)).toBe(1)
  })

  test("超过 12 个工作区抛 INVALID_INPUT", async () => {
    const t = convexTest(schema, modules)
    const workspaceIds = []

    for (let index = 0; index < 13; index += 1) {
      workspaceIds.push(await createWorkspace(t, `工作区 ${index}`))
    }

    const noteId = await createNote(t, "超出上限", [])

    await expect(
      t.withIdentity(owner).mutation(api.workspaces.setItemWorkspaces, {
        inspirationId: noteId,
        workspaceIds
      })
    ).rejects.toThrow("Use 12 workspaces or fewer.")

    expect(await countMemberships(t)).toBe(0)
  })

  test("他人的内容不能被他人的请求改动", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const noteId = await createNote(t, "受保护", [reading])

    await expect(
      t.withIdentity(other).mutation(api.workspaces.setItemWorkspaces, {
        inspirationId: noteId,
        workspaceIds: []
      })
    ).rejects.toThrow("Workspace item is not available.")

    expect(await readWorkspaceIds(t, noteId)).toEqual([reading])
  })
})

describe("workspaces.addItem / removeItem", () => {
  test("addItem 保留已有归属，重复调用幂等", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")
    const noteId = await createNote(t, "先属于阅读", [reading])

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await t.withIdentity(owner).mutation(api.workspaces.addItem, {
        workspaceId: design,
        inspirationId: noteId
      })
    }

    expect(sorted(await readWorkspaceIds(t, noteId))).toEqual(
      sorted([reading, design])
    )
    expect(await countMemberships(t)).toBe(2)
    expect((await findWorkspace(t, "设计"))?.itemCount).toBe(1)
  })

  test("removeItem 只移除该工作区，内容与其他归属不变", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")
    const noteId = await createNote(t, "两个工作区", [reading, design])

    await t.withIdentity(owner).mutation(api.workspaces.removeItem, {
      workspaceId: reading,
      inspirationId: noteId
    })

    expect(await readWorkspaceIds(t, noteId)).toEqual([design])
    expect((await findWorkspace(t, "阅读"))?.itemCount).toBe(0)

    const list = await t.withIdentity(owner).query(api.notes.listMine, {})
    expect(list.map((note) => note.id)).toContain(noteId)
  })

  test("移除不存在的成员关系抛 NOT_FOUND", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")
    const noteId = await createNote(t, "只在阅读", [reading])

    await expect(
      t.withIdentity(owner).mutation(api.workspaces.removeItem, {
        workspaceId: design,
        inspirationId: noteId
      })
    ).rejects.toThrow("Workspace item is not available.")
  })

  test("不能把内容加入他人的工作区", async () => {
    const t = convexTest(schema, modules)
    const othersWorkspace = await createWorkspace(t, "别人的工作区", other)
    const noteId = await createNote(t, "自己的内容", [])

    await expect(
      t.withIdentity(owner).mutation(api.workspaces.addItem, {
        workspaceId: othersWorkspace,
        inspirationId: noteId
      })
    ).rejects.toThrow("Workspace is not available.")

    expect(await countMemberships(t)).toBe(0)
  })

  test("不能把他人的内容加入自己的工作区", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const othersNoteId = await createNote(t, "别人的内容", [], other)

    await expect(
      t.withIdentity(owner).mutation(api.workspaces.addItem, {
        workspaceId: reading,
        inspirationId: othersNoteId
      })
    ).rejects.toThrow("Workspace item is not available.")

    expect(await countMemberships(t)).toBe(0)
  })
})

describe("workspaces.remove / getDetail", () => {
  test("删除工作区只删成员关系，内容留在 All 与其他工作区", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")
    const noteId = await createNote(t, "两个工作区", [reading, design])

    await t.withIdentity(owner).mutation(api.workspaces.remove, { id: reading })

    expect(await readWorkspaceIds(t, noteId)).toEqual([design])
    expect(await findWorkspace(t, "阅读")).toBeUndefined()

    const list = await t.withIdentity(owner).query(api.notes.listMine, {})
    expect(list.map((note) => note.id)).toContain(noteId)
  })

  test("getDetail 返回工作区条目，一条内容只出现一次", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")
    await createNote(t, "两个工作区都有的内容", [reading, design])
    await createNote(t, "只在阅读", [reading])

    const detail = await t.withIdentity(owner).query(api.workspaces.getDetail, {
      id: reading
    })

    expect(detail.name).toBe("阅读")
    expect(detail.items).toHaveLength(2)
    expect(new Set(detail.items.map((item) => item.id)).size).toBe(2)
  })

  test("他人的工作区不可读也不可写", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")

    await expect(
      t.withIdentity(other).query(api.workspaces.getDetail, { id: reading })
    ).rejects.toThrow("Workspace is not available.")

    await expect(
      t.withIdentity(other).mutation(api.workspaces.rename, {
        id: reading,
        name: "被改名"
      })
    ).rejects.toThrow("Workspace is not available.")

    await expect(
      t.withIdentity(other).mutation(api.workspaces.remove, { id: reading })
    ).rejects.toThrow("Workspace is not available.")

    expect(await findWorkspace(t, "阅读")).toBeDefined()
  })
})
