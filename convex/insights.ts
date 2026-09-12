import { v } from "convex/values"

import { buildInsightsSummary } from "../packages/contracts/src/index"
import { query } from "./_generated/server"
import { requireOwner } from "./lib/auth"

/**
 * Owner-scoped insights aggregate.
 *
 * Reads the owner's current rows only, so a deletion disappears from every
 * figure at once (D09). Day, week and month boundaries are resolved in the
 * caller's IANA time zone, which is why the aggregate lives on the server: the
 * client sends the zone, the server owns the arithmetic.
 */
export const summary = query({
  args: {
    timeZone: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const rows = await ctx.db
      .query("inspirations")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerId", ownerId))
      .collect()

    return buildInsightsSummary(
      rows.map((row) => ({
        createdAt: row.createdAt,
        type: row.type,
        tags: row.tags
      })),
      Date.now(),
      args.timeZone
    )
  }
})
