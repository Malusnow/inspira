import { ConvexError, v } from "convex/values"

import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import {
  getWorkspaceNameKey,
  normalizeWorkspaceIds,
  validateWorkspaceName
} from "../../packages/contracts/src/index"

export const createWorkspaceArgs = {
  name: v.string()
}

export const workspaceIdArgs = {
  id: v.id("workspaces")
}

export const removeWorkspaceItemArgs = {
  workspaceId: v.id("workspaces"),
  inspirationId: v.id("inspirations")
}

export const addWorkspaceItemArgs = {
  workspaceId: v.id("workspaces"),
  inspirationId: v.id("inspirations")
}

export const setItemWorkspacesArgs = {
  inspirationId: v.id("inspirations"),
  /** Complete replacement set; empty moves the item back to All only. */
  workspaceIds: v.array(v.string())
}

export const renameWorkspaceArgs = {
  id: v.id("workspaces"),
  name: v.string()
}

/**
 * Shared arg fragment for the membership inputs on note / capture writes.
 * `workspaceId` stays as a single-value legacy entry point; both are normalized
 * into `workspaceIds` before use.
 */
export const workspaceIdsArgs = {
  workspaceIds: v.optional(v.array(v.string())),
  workspaceId: v.optional(v.string())
}

export function cleanWorkspaceName(name: string) {
  try {
    return validateWorkspaceName(name)
  } catch (error) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message:
        error instanceof Error ? error.message : "Invalid workspace name."
    })
  }
}

export function toWorkspaceNameKey(name: string) {
  return getWorkspaceNameKey(name)
}

/**
 * Normalizes client-supplied workspace inputs (dedupe, drop empties, enforce
 * the count cap) and maps contract validation errors to `INVALID_INPUT`.
 * Convex ids stay untouched; ownership is validated separately.
 */
export function cleanWorkspaceIds(input: {
  workspaceIds?: string[]
  workspaceId?: string
}): string[] {
  try {
    return normalizeWorkspaceIds(input)
  } catch (error) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message:
        error instanceof Error ? error.message : "Invalid workspace ids."
    })
  }
}

export function workspaceUnavailableError() {
  return new ConvexError({
    code: "WORKSPACE_UNAVAILABLE",
    message: "Workspace is not available."
  })
}

export function workspaceItemUnavailableError() {
  return new ConvexError({
    code: "NOT_FOUND",
    message: "Workspace item is not available."
  })
}

/**
 * Resolves client-supplied workspace ids into owned workspace ids. Empty input
 * returns an empty array. Throws `WORKSPACE_UNAVAILABLE` when any id is
 * malformed or not owned by the caller, so a client can never attach content to
 * a workspace it does not own and cannot tell "missing" from "someone else's".
 */
export async function resolveOwnedWorkspaceIds(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  workspaceIds: string[]
): Promise<Array<Id<"workspaces">>> {
  const resolved: Array<Id<"workspaces">> = []

  for (const workspaceId of workspaceIds) {
    const normalizedId = ctx.db.normalizeId("workspaces", workspaceId)

    if (!normalizedId) {
      throw workspaceUnavailableError()
    }

    const workspace = await ctx.db.get(normalizedId)

    if (!workspace || workspace.ownerId !== ownerId) {
      throw workspaceUnavailableError()
    }

    resolved.push(normalizedId)
  }

  return resolved
}

export type WorkspaceMembership = Doc<"workspaceMemberships">

/** Memberships of one workspace, newest first. */
export async function listWorkspaceMembershipsByWorkspace(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  workspaceId: Id<"workspaces">,
  limit = 500
): Promise<Array<WorkspaceMembership>> {
  return await ctx.db
    .query("workspaceMemberships")
    .withIndex("by_owner_workspace_createdAt", (q) =>
      q.eq("ownerId", ownerId).eq("workspaceId", workspaceId)
    )
    .order("desc")
    .take(limit)
}

/** Every workspace a single inspiration belongs to (bounded by the count cap). */
export async function listWorkspaceMembershipsByInspiration(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  inspirationId: Id<"inspirations">
): Promise<Array<WorkspaceMembership>> {
  return await ctx.db
    .query("workspaceMemberships")
    .withIndex("by_owner_inspiration", (q) =>
      q.eq("ownerId", ownerId).eq("inspirationId", inspirationId)
    )
    .take(64)
}

async function findWorkspaceMembership(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  inspirationId: Id<"inspirations">,
  workspaceId: Id<"workspaces">
): Promise<WorkspaceMembership | null> {
  return await ctx.db
    .query("workspaceMemberships")
    .withIndex("by_owner_inspiration_workspace", (q) =>
      q
        .eq("ownerId", ownerId)
        .eq("inspirationId", inspirationId)
        .eq("workspaceId", workspaceId)
    )
    .first()
}

/** Workspace ids an inspiration belongs to, for hydrating `workspaceIds`. */
export async function listWorkspaceIdsForInspiration(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  inspirationId: Id<"inspirations">
): Promise<string[]> {
  const memberships = await listWorkspaceMembershipsByInspiration(
    ctx,
    ownerId,
    inspirationId
  )

  return memberships.map((membership) => membership.workspaceId)
}

/**
 * Adds the missing (inspiration, workspace) rows and returns the ids that were
 * newly inserted. Already-present rows are left untouched, so a retry never
 * creates a duplicate membership.
 */
export async function ensureWorkspaceMemberships(
  ctx: MutationCtx,
  ownerId: string,
  inspirationId: Id<"inspirations">,
  workspaceIds: Array<Id<"workspaces">>
): Promise<Array<Id<"workspaces">>> {
  const added: Array<Id<"workspaces">> = []
  const now = Date.now()

  for (const workspaceId of workspaceIds) {
    const existing = await findWorkspaceMembership(
      ctx,
      ownerId,
      inspirationId,
      workspaceId
    )

    if (existing) {
      continue
    }

    await ctx.db.insert("workspaceMemberships", {
      ownerId,
      inspirationId,
      workspaceId,
      createdAt: now,
      updatedAt: now
    })
    added.push(workspaceId)
  }

  return added
}

/**
 * Diffs the inspiration's memberships against the desired set: inserts missing
 * rows and deletes rows no longer selected. Returns the changed workspace ids so
 * callers can touch only the affected workspaces.
 */
export async function syncWorkspaceMemberships(
  ctx: MutationCtx,
  ownerId: string,
  inspirationId: Id<"inspirations">,
  workspaceIds: Array<Id<"workspaces">>
): Promise<{ added: Array<Id<"workspaces">>; removed: Array<Id<"workspaces">> }> {
  const existing = await listWorkspaceMembershipsByInspiration(
    ctx,
    ownerId,
    inspirationId
  )
  const desired = new Set<string>(workspaceIds)
  const existingIds = new Set<string>(
    existing.map((membership) => membership.workspaceId)
  )
  const now = Date.now()
  const added: Array<Id<"workspaces">> = []
  const removed: Array<Id<"workspaces">> = []

  for (const workspaceId of workspaceIds) {
    if (existingIds.has(workspaceId)) {
      continue
    }

    await ctx.db.insert("workspaceMemberships", {
      ownerId,
      inspirationId,
      workspaceId,
      createdAt: now,
      updatedAt: now
    })
    added.push(workspaceId)
  }

  for (const membership of existing) {
    if (desired.has(membership.workspaceId)) {
      continue
    }

    await ctx.db.delete(membership._id)
    removed.push(membership.workspaceId)
  }

  return { added, removed }
}

/** Removes a single (inspiration, workspace) membership. Idempotent. */
export async function deleteWorkspaceMembership(
  ctx: MutationCtx,
  ownerId: string,
  inspirationId: Id<"inspirations">,
  workspaceId: Id<"workspaces">
): Promise<boolean> {
  const existing = await findWorkspaceMembership(
    ctx,
    ownerId,
    inspirationId,
    workspaceId
  )

  if (!existing) {
    return false
  }

  await ctx.db.delete(existing._id)
  return true
}

/** Removes every membership that points at the workspace. Returns removed ids. */
export async function deleteWorkspaceMembershipsForWorkspace(
  ctx: MutationCtx,
  ownerId: string,
  workspaceId: Id<"workspaces">
): Promise<Array<Id<"inspirations">>> {
  const memberships = await listWorkspaceMembershipsByWorkspace(
    ctx,
    ownerId,
    workspaceId
  )
  const removed: Array<Id<"inspirations">> = []

  for (const membership of memberships) {
    await ctx.db.delete(membership._id)
    removed.push(membership.inspirationId)
  }

  return removed
}

/** Removes every membership of one inspiration. Returns removed workspace ids. */
export async function deleteWorkspaceMembershipsForInspiration(
  ctx: MutationCtx,
  ownerId: string,
  inspirationId: Id<"inspirations">
): Promise<Array<Id<"workspaces">>> {
  const memberships = await listWorkspaceMembershipsByInspiration(
    ctx,
    ownerId,
    inspirationId
  )

  for (const membership of memberships) {
    await ctx.db.delete(membership._id)
  }

  return memberships.map((membership) => membership.workspaceId)
}

/** Bumps updatedAt for each distinct workspace whose membership changed. */
export async function touchWorkspaces(
  ctx: MutationCtx,
  workspaceIds: Array<Id<"workspaces"> | undefined>
) {
  const uniqueIds = new Set<Id<"workspaces">>()

  for (const workspaceId of workspaceIds) {
    if (workspaceId) {
      uniqueIds.add(workspaceId)
    }
  }

  if (uniqueIds.size === 0) {
    return
  }

  const now = Date.now()

  for (const workspaceId of uniqueIds) {
    await ctx.db.patch(workspaceId, { updatedAt: now })
  }
}
