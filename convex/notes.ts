import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireOwner } from "./lib/auth"
import {
  cleanCreate,
  cleanUpdate,
  createArgs,
  removeArgs,
  STARTER_NOTES_VERSION,
  starters,
  toInspiration,
  updateArgs
} from "./lib/notes"
import { resolveOwnedWorkspaceId, touchWorkspace } from "./lib/workspaces"

export const create = mutation({
  args: createArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const note = cleanCreate(args)
    const workspaceId = await resolveOwnedWorkspaceId(
      ctx,
      ownerId,
      note.workspaceId
    )
    const now = Date.now()
    const noteId = await ctx.db.insert("inspirations", {
      ownerId,
      type: "note",
      title: note.title,
      content: note.content,
      notes: note.notes,
      tags: note.tags,
      workspaceId,
      createdAt: now,
      updatedAt: now
    })

    await touchWorkspace(ctx, workspaceId)

    return noteId
  }
})

export const update = mutation({
  args: updateArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const existingNote = await ctx.db.get(args.id)

    if (!existingNote || existingNote.ownerId !== ownerId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Note is not available."
      })
    }

    const note = cleanUpdate(args)
    const workspaceId = await resolveOwnedWorkspaceId(
      ctx,
      ownerId,
      note.workspaceId
    )
    const previousWorkspaceId = existingNote.workspaceId
      ? ctx.db.normalizeId("workspaces", existingNote.workspaceId)
      : undefined
    const now = Date.now()

    await ctx.db.patch(args.id, {
      title: note.title,
      content: note.content,
      notes: note.notes,
      tags: note.tags,
      workspaceId,
      updatedAt: now
    })

    if (previousWorkspaceId !== workspaceId) {
      await touchWorkspace(ctx, workspaceId)
      await touchWorkspace(ctx, previousWorkspaceId ?? undefined)
    }

    return args.id
  }
})

export const remove = mutation({
  args: removeArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const existingNote = await ctx.db.get(args.id)

    if (!existingNote || existingNote.ownerId !== ownerId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Note is not available."
      })
    }

    await ctx.db.delete(args.id)

    await touchWorkspace(
      ctx,
      existingNote.workspaceId
        ? ctx.db.normalizeId("workspaces", existingNote.workspaceId) ??
            undefined
        : undefined
    )

    return args.id
  }
})

export const seedStarterNotes = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx)
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

    for (const [index, note] of starters.entries()) {
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

    return { created: true, count: starters.length }
  }
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx)
    const notes = await ctx.db
      .query("inspirations")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .take(100)

    return notes.map(toInspiration)
  }
})

export const getMine = query({
  args: {
    id: v.id("inspirations")
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const note = await ctx.db.get(args.id)

    if (!note || note.ownerId !== ownerId) {
      return null
    }

    return toInspiration(note)
  }
})
