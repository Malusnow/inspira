// @vitest-environment edge-runtime
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

const owner = { subject: "user-notes-owner" }
const other = { subject: "user-notes-other" }

type TestConvex = ReturnType<typeof convexTest>

const sorted = (ids: readonly string[]) => [...ids].sort()

async function countRows(t: TestConvex, table: "inspirations" | "workspaceMemberships") {
  return await t.run(async (ctx) => (await ctx.db.query(table).collect()).length)
}

async function createWorkspace(t: TestConvex, name: string, identity = owner) {
  return await t.withIdentity(identity).mutation(api.workspaces.create, { name })
}

async function readWorkspaceIds(t: TestConvex, noteId: Id<"inspirations">) {
  const note = await t.withIdentity(owner).query(api.notes.getMine, {
    id: noteId
  })

  return note?.workspaceIds ?? []
}

describe("notes.create 的工作区归属", () => {
  test("一条笔记可以同时加入多个工作区", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")

    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "同一条笔记同时属于两个工作区",
      workspaceIds: [reading, design]
    })

    expect(sorted(await readWorkspaceIds(t, noteId))).toEqual(
      sorted([reading, design])
    )

    const list = await t.withIdentity(owner).query(api.notes.listMine, {})
    expect(sorted(list[0].workspaceIds)).toEqual(sorted([reading, design]))
    expect(await countRows(t, "workspaceMemberships")).toBe(2)
  })

  test("重复 id 与 legacy 单值合并后只写一行成员关系", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")

    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "重复 id 应被去重",
      workspaceIds: [reading, reading, ""],
      workspaceId: reading
    })

    expect(await readWorkspaceIds(t, noteId)).toEqual([reading])
    expect(await countRows(t, "workspaceMemberships")).toBe(1)
  })

  test("legacy workspaceId 仍可写入归属", async () => {
    const t = convexTest(schema, modules)
    const design = await createWorkspace(t, "设计")

    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "旧入参仍可用",
      workspaceId: design
    })

    expect(await readWorkspaceIds(t, noteId)).toEqual([design])
  })

  test("未选择工作区时 workspaceIds 为空数组", async () => {
    const t = convexTest(schema, modules)

    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "未整理的内容"
    })

    expect(await readWorkspaceIds(t, noteId)).toEqual([])
    expect(await countRows(t, "workspaceMemberships")).toBe(0)
  })

  test("超过 12 个工作区抛 INVALID_INPUT 且不落库", async () => {
    const t = convexTest(schema, modules)
    const workspaceIds = []

    for (let index = 0; index < 13; index += 1) {
      workspaceIds.push(await createWorkspace(t, `工作区 ${index}`))
    }

    await expect(
      t.withIdentity(owner).mutation(api.notes.create, {
        content: "超出上限",
        workspaceIds
      })
    ).rejects.toThrow("Use 12 workspaces or fewer.")

    expect(await countRows(t, "inspirations")).toBe(0)
    expect(await countRows(t, "workspaceMemberships")).toBe(0)
  })

  test("陌生或他人的工作区抛 WORKSPACE_UNAVAILABLE 且不落库", async () => {
    const t = convexTest(schema, modules)
    const othersWorkspace = await createWorkspace(t, "别人的工作区", other)

    await expect(
      t.withIdentity(owner).mutation(api.notes.create, {
        content: "越权归属",
        workspaceIds: [othersWorkspace]
      })
    ).rejects.toThrow("Workspace is not available.")

    await expect(
      t.withIdentity(owner).mutation(api.notes.create, {
        content: "非法 id",
        workspaceIds: ["not-a-workspace-id"]
      })
    ).rejects.toThrow("Workspace is not available.")

    expect(await countRows(t, "inspirations")).toBe(0)
  })
})

describe("notes.update 的工作区归属", () => {
  test("新增工作区时保留原有归属", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")
    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "原有归属",
      workspaceIds: [reading]
    })

    await t.withIdentity(owner).mutation(api.notes.update, {
      id: noteId,
      content: "原有归属",
      workspaceIds: [reading, design]
    })

    expect(sorted(await readWorkspaceIds(t, noteId))).toEqual(
      sorted([reading, design])
    )
  })

  test("取消勾选只移除该工作区，其余归属保留", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")
    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "两个工作区",
      workspaceIds: [reading, design]
    })

    await t.withIdentity(owner).mutation(api.notes.update, {
      id: noteId,
      content: "两个工作区",
      workspaceIds: [design]
    })

    expect(await readWorkspaceIds(t, noteId)).toEqual([design])
    expect(await countRows(t, "workspaceMemberships")).toBe(1)
  })

  test("传空数组清空归属但内容仍在 All", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "移出所有工作区",
      workspaceIds: [reading]
    })

    await t.withIdentity(owner).mutation(api.notes.update, {
      id: noteId,
      content: "移出所有工作区",
      workspaceIds: []
    })

    expect(await readWorkspaceIds(t, noteId)).toEqual([])
    expect(await countRows(t, "workspaceMemberships")).toBe(0)

    const list = await t.withIdentity(owner).query(api.notes.listMine, {})
    expect(list.map((note) => note.id)).toContain(noteId)
  })

  test("重复提交同一集合不产生重复成员行", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "可重试",
      workspaceIds: [reading]
    })

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await t.withIdentity(owner).mutation(api.notes.update, {
        id: noteId,
        content: "可重试",
        workspaceIds: [reading]
      })
    }

    expect(await readWorkspaceIds(t, noteId)).toEqual([reading])
    expect(await countRows(t, "workspaceMemberships")).toBe(1)
  })

  test("包含他人工区时整体拒绝且归属与内容都不变", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const othersWorkspace = await createWorkspace(t, "别人的工作区", other)
    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "原始内容",
      workspaceIds: [reading]
    })

    await expect(
      t.withIdentity(owner).mutation(api.notes.update, {
        id: noteId,
        content: "被拒绝的改动",
        workspaceIds: [reading, othersWorkspace]
      })
    ).rejects.toThrow("Workspace is not available.")

    expect(await readWorkspaceIds(t, noteId)).toEqual([reading])

    const note = await t.withIdentity(owner).query(api.notes.getMine, {
      id: noteId
    })
    expect(note?.content).toBe("原始内容")
  })

  test("另一账户改不到他人笔记的归属", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "受保护的内容",
      workspaceIds: [reading]
    })

    await expect(
      t.withIdentity(other).mutation(api.notes.update, {
        id: noteId,
        content: "越权修改",
        workspaceIds: []
      })
    ).rejects.toThrow("Note is not available.")

    expect(await readWorkspaceIds(t, noteId)).toEqual([reading])
  })
})

describe("notes.remove 的工作区归属", () => {
  test("删除笔记连带清理成员关系", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const design = await createWorkspace(t, "设计")
    const noteId = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "待删除",
      workspaceIds: [reading, design]
    })

    await t.withIdentity(owner).mutation(api.notes.remove, { id: noteId })

    expect(await countRows(t, "inspirations")).toBe(0)
    expect(await countRows(t, "workspaceMemberships")).toBe(0)
  })

  test("同一工作区里的其他笔记不受影响", async () => {
    const t = convexTest(schema, modules)
    const reading = await createWorkspace(t, "阅读")
    const doomed = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "待删除",
      workspaceIds: [reading]
    })
    const kept = await t.withIdentity(owner).mutation(api.notes.create, {
      content: "保留",
      workspaceIds: [reading]
    })

    await t.withIdentity(owner).mutation(api.notes.remove, { id: doomed })

    expect(await readWorkspaceIds(t, kept)).toEqual([reading])

    const list = await t.withIdentity(owner).query(api.workspaces.listMine, {})
    expect(list[0].itemCount).toBe(1)
  })
})
