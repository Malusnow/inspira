import { describe, expect, test } from "vitest"

import {
  CaptureValidationError,
  INSPIRATION_WORKSPACE_MAX_COUNT,
  WorkspaceIdsValidationError,
  normalizeCaptureRequest,
  normalizeWorkspaceIds
} from "./index"

function workspaceIdsOf(count: number) {
  return Array.from({ length: count }, (_, index) => `workspace-${index}`)
}

describe("normalizeWorkspaceIds", () => {
  test("空值与空字符串被丢弃", () => {
    expect(normalizeWorkspaceIds({})).toEqual([])
    expect(normalizeWorkspaceIds({ workspaceIds: [] })).toEqual([])
    expect(normalizeWorkspaceIds({ workspaceIds: ["", "", "w1"] })).toEqual([
      "w1"
    ])
    expect(normalizeWorkspaceIds({ workspaceId: "" })).toEqual([])
  })

  test("按首次出现顺序去重", () => {
    expect(
      normalizeWorkspaceIds({ workspaceIds: ["w2", "w1", "w2", "w1", "w3"] })
    ).toEqual(["w2", "w1", "w3"])
  })

  test("legacy 单值合并进 workspaceIds", () => {
    expect(
      normalizeWorkspaceIds({ workspaceIds: ["w1", "w2"], workspaceId: "w1" })
    ).toEqual(["w1", "w2"])
    expect(normalizeWorkspaceIds({ workspaceId: "w1" })).toEqual(["w1"])
  })

  test("上限内允许，超出上限抛 WorkspaceIdsValidationError", () => {
    const atLimit = workspaceIdsOf(INSPIRATION_WORKSPACE_MAX_COUNT)
    const overLimit = workspaceIdsOf(INSPIRATION_WORKSPACE_MAX_COUNT + 1)

    expect(normalizeWorkspaceIds({ workspaceIds: atLimit })).toHaveLength(
      INSPIRATION_WORKSPACE_MAX_COUNT
    )

    expect(() => normalizeWorkspaceIds({ workspaceIds: overLimit })).toThrow(
      WorkspaceIdsValidationError
    )

    try {
      normalizeWorkspaceIds({ workspaceIds: overLimit })
      throw new Error("expected normalizeWorkspaceIds to throw")
    } catch (error) {
      expect(error).toBeInstanceOf(WorkspaceIdsValidationError)
      expect((error as WorkspaceIdsValidationError).code).toBe("INVALID_INPUT")
      expect((error as Error).message).toBe(
        `Use ${INSPIRATION_WORKSPACE_MAX_COUNT} workspaces or fewer.`
      )
    }
  })

  test("先按去重结果判上限", () => {
    const duplicated = [
      ...workspaceIdsOf(INSPIRATION_WORKSPACE_MAX_COUNT),
      "workspace-0"
    ]

    expect(normalizeWorkspaceIds({ workspaceIds: duplicated })).toHaveLength(
      INSPIRATION_WORKSPACE_MAX_COUNT
    )
  })
})

describe("normalizeCaptureRequest 的工作区归一化", () => {
  const quoteRequest = {
    clientRequestId: "req-quote-1",
    kind: "quote",
    sourceUrl: "https://example.com/article",
    selectedText: "被引用的句子"
  }

  test("归一化 workspaceIds 并合并 legacy 单值，结果只保留 workspaceIds", () => {
    const request = normalizeCaptureRequest({
      ...quoteRequest,
      workspaceIds: ["w2", "", "w2"],
      workspaceId: "w1"
    })

    expect(request.workspaceIds).toEqual(["w2", "w1"])
    expect(request).not.toHaveProperty("workspaceId")
  })

  test("未传工作区时归一化为空数组", () => {
    expect(normalizeCaptureRequest(quoteRequest).workspaceIds).toEqual([])
  })

  test("超出上限时抛 CaptureValidationError 的 INVALID_INPUT", () => {
    expect(() =>
      normalizeCaptureRequest({
        ...quoteRequest,
        workspaceIds: workspaceIdsOf(INSPIRATION_WORKSPACE_MAX_COUNT + 1)
      })
    ).toThrow(CaptureValidationError)

    try {
      normalizeCaptureRequest({
        ...quoteRequest,
        workspaceIds: workspaceIdsOf(INSPIRATION_WORKSPACE_MAX_COUNT + 1)
      })
      throw new Error("expected normalizeCaptureRequest to throw")
    } catch (error) {
      expect((error as CaptureValidationError).code).toBe("INVALID_INPUT")
      expect((error as Error).message).toBe(
        `Use ${INSPIRATION_WORKSPACE_MAX_COUNT} workspaces or fewer.`
      )
    }
  })
})
