import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  inspirations: defineTable({
    ownerId: v.string(),
    type: v.literal("note"),
    title: v.optional(v.string()),
    content: v.string(),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
    workspaceId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_owner_createdAt", ["ownerId", "createdAt"]),
  userInitializations: defineTable({
    ownerId: v.string(),
    starterNotesSeededAt: v.optional(v.number()),
    starterNotesVersion: v.optional(v.number())
  }).index("by_owner", ["ownerId"])
})
