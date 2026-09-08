import { ConvexError, v } from "convex/values"

import {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  type CreateNoteInput,
  type NoteInspiration
} from "../packages/contracts/src/index"
import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

const noteArgs = {
  title: v.optional(v.string()),
  content: v.string(),
  tags: v.optional(v.array(v.string())),
  workspaceId: v.optional(v.string())
}

const STARTER_NOTES_VERSION = 1
const starterNotes: Array<Pick<NoteInspiration, "title" | "content" | "tags">> = [
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

async function requireOwnerId(ctx: {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>
  }
}) {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Login is required to access notes."
    })
  }

  return identity.subject
}

function normalizeOptionalText(value: string | undefined, maxLength: number) {
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

function normalizeTags(tags: string[] | undefined) {
  const normalizedTags = Array.from(
    new Set(
      (tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0)
    )
  )

  if (normalizedTags.length > NOTE_TAG_MAX_COUNT) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message: `Use ${NOTE_TAG_MAX_COUNT} tags or fewer.`
    })
  }

  for (const tag of normalizedTags) {
    if (tag.length > NOTE_TAG_MAX_LENGTH) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: `Tags must be ${NOTE_TAG_MAX_LENGTH} characters or fewer.`
      })
    }
  }

  return normalizedTags
}

function normalizeCreateNoteInput(args: CreateNoteInput) {
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
    title: normalizeOptionalText(args.title, NOTE_TITLE_MAX_LENGTH),
    content,
    tags: normalizeTags(args.tags),
    workspaceId: normalizeOptionalText(args.workspaceId, 128)
  }
}

function toNote(doc: Doc<"inspirations">): NoteInspiration {
  return {
    id: doc._id,
    type: "note",
    title: doc.title,
    content: doc.content,
    tags: doc.tags,
    workspaceId: doc.workspaceId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const create = mutation({
  args: noteArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx)
    const note = normalizeCreateNoteInput(args)
    const now = Date.now()

    return await ctx.db.insert("inspirations", {
      ownerId,
      type: "note",
      title: note.title,
      content: note.content,
      tags: note.tags,
      workspaceId: note.workspaceId,
      createdAt: now,
      updatedAt: now
    })
  }
})

export const seedStarterNotes = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireOwnerId(ctx)
    const existingInitialization = await ctx.db
      .query("userInitializations")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first()

    if (existingInitialization?.starterNotesSeededAt) {
      return { created: false, count: 0 }
    }

    const existingNote = await ctx.db
      .query("inspirations")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
      .first()

    if (existingNote) {
      const now = Date.now()

      if (existingInitialization) {
        await ctx.db.patch(existingInitialization._id, {
          starterNotesSeededAt: now,
          starterNotesVersion: STARTER_NOTES_VERSION
        })
      } else {
        await ctx.db.insert("userInitializations", {
          ownerId,
          starterNotesSeededAt: now,
          starterNotesVersion: STARTER_NOTES_VERSION
        })
      }

      return { created: false, count: 0 }
    }

    const now = Date.now()

    for (const [index, note] of starterNotes.entries()) {
      await ctx.db.insert("inspirations", {
        ownerId,
        type: "note",
        title: note.title,
        content: note.content,
        tags: note.tags,
        createdAt: now - index * 60 * 1000,
        updatedAt: now - index * 60 * 1000
      })
    }

    if (existingInitialization) {
      await ctx.db.patch(existingInitialization._id, {
        starterNotesSeededAt: now,
        starterNotesVersion: STARTER_NOTES_VERSION
      })
    } else {
      await ctx.db.insert("userInitializations", {
        ownerId,
        starterNotesSeededAt: now,
        starterNotesVersion: STARTER_NOTES_VERSION
      })
    }

    return { created: true, count: starterNotes.length }
  }
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireOwnerId(ctx)
    const notes = await ctx.db
      .query("inspirations")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .take(100)

    return notes.map(toNote)
  }
})

export const getMine = query({
  args: {
    id: v.id("inspirations")
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx)
    const note = await ctx.db.get(args.id as Id<"inspirations">)

    if (!note || note.ownerId !== ownerId) {
      return null
    }

    return toNote(note)
  }
})
