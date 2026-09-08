import { ConvexError } from "convex/values"

export async function requireOwner(ctx: {
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
