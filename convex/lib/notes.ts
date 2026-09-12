import { ConvexError, v } from "convex/values"

import type { Doc } from "../_generated/dataModel"
import {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_NOTES_MAX_LENGTH,
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  type CreateNoteInput,
  type InspirationItem,
  type UpdateNoteInput
} from "../../packages/contracts/src/index"

export const createArgs = {
  title: v.optional(v.string()),
  content: v.string(),
  notes: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  workspaceId: v.optional(v.string())
}

export const updateArgs = {
  id: v.id("inspirations"),
  ...createArgs
}

export const removeArgs = {
  id: v.id("inspirations")
}

export const STARTER_NOTES_VERSION = 1

export const starters: Array<
  Pick<InspirationItem, "title" | "content" | "tags">
> = [
  {
    title: "产品评审准备",
    content:
      "下周产品评审需要准备：\n1. 用户调研数据\n2. 竞品分析报告\n3. 原型演示与反馈收集",
    tags: ["product", "review"]
  },
  {
    title: "颜色是信息本身",
    content: "颜色不是视觉的附属品，它是信息本身。\n\n-- Josef Albers",
    tags: ["color", "design"]
  },
  {
    title: "尽可能少的设计",
    content: "好的设计是尽可能少的设计。\n\n-- Dieter Rams",
    tags: ["design", "quote"]
  },
  {
    title: "简单与复杂",
    content: "简单是终极的复杂。\n\n-- Leonardo da Vinci",
    tags: ["quote", "thinking"]
  }
]

function cleanText(value: string | undefined, maxLength: number) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return undefined
  }

  if (trimmed.length > maxLength) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message: `Text must be ${maxLength} characters or fewer.`
    })
  }

  return trimmed
}

function cleanTags(tags: string[] | undefined) {
  const cleanedTags = Array.from(
    new Set(
      (tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0)
    )
  )

  if (cleanedTags.length > NOTE_TAG_MAX_COUNT) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message: `Use ${NOTE_TAG_MAX_COUNT} tags or fewer.`
    })
  }

  for (const tag of cleanedTags) {
    if (tag.length > NOTE_TAG_MAX_LENGTH) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: `Tags must be ${NOTE_TAG_MAX_LENGTH} characters or fewer.`
      })
    }
  }

  return cleanedTags
}

export function cleanCreate(args: CreateNoteInput) {
  const content = args.content.trim()

  if (!content) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message: "Note content is required."
    })
  }

  if (content.length > NOTE_CONTENT_MAX_LENGTH) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message: `Note content must be ${NOTE_CONTENT_MAX_LENGTH} characters or fewer.`
    })
  }

  return {
    title: cleanText(args.title, NOTE_TITLE_MAX_LENGTH),
    content,
    notes: cleanText(args.notes, NOTE_NOTES_MAX_LENGTH),
    tags: cleanTags(args.tags),
    // workspaceId is an opaque Convex id: never trim/limit it here. Existence and
    // ownership are validated against the DB in the handler via
    // `resolveOwnedWorkspaceId`.
    workspaceId: args.workspaceId
  }
}

export function cleanUpdate(args: UpdateNoteInput) {
  return cleanCreate(args)
}

/**
 * Maps a stored row onto the shared item shape. Notes and captures live in one
 * table, so the stored `type` is passed through instead of being forced to
 * "note"; capture-only columns stay optional.
 */
export function toInspiration(doc: Doc<"inspirations">): InspirationItem {
  return {
    id: doc._id,
    type: doc.type,
    title: doc.title,
    content: doc.content,
    notes: doc.notes,
    tags: doc.tags,
    workspaceId: doc.workspaceId,
    sourceUrl: doc.sourceUrl,
    imageUrl: doc.imageUrl,
    selectedText: doc.selectedText,
    capturedAt: doc.capturedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}
