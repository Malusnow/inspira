import type { Id } from "../../../../convex/_generated/dataModel"

/**
 * Contracts model ids as plain strings so they stay framework-agnostic, while
 * Convex brands them. Funnelling the cast through these helpers keeps the
 * conversion explicit and out of feature components.
 */
export function toInspirationId(id: string) {
  return id as Id<"inspirations">
}

export function toWorkspaceId(id: string) {
  return id as Id<"workspaces">
}

export function toMediaAssetId(id: string) {
  return id as Id<"mediaAssets">
}

export function toStorageId(id: string) {
  return id as Id<"_storage">
}
