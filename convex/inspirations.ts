import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { query } from "./_generated/server"
import { requireOwner } from "./lib/auth"
import { hydrateInspiration } from "./lib/inspirations"

/** The owner's inspiration feed, newest first and hydrated one page at a time. */
export const listMine = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const result = await ctx.db
      .query("inspirations")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .paginate(args.paginationOpts)

    return {
      ...result,
      page: await Promise.all(
        result.page.map((item) => hydrateInspiration(ctx, item))
      )
    }
  }
})

export const getMine = query({
  args: {
    id: v.id("inspirations")
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const item = await ctx.db.get(args.id)

    if (!item || item.ownerId !== ownerId) {
      return null
    }

    return await hydrateInspiration(ctx, item)
  }
})
