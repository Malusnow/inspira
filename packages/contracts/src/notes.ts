import type { InspirationType } from "./content"
import type {
  MediaAssetStatus,
  MediaAssetView,
  PageSnapshotView
} from "./media"

export const NOTE_TITLE_MAX_LENGTH = 120
export const NOTE_CONTENT_MAX_LENGTH = 10000
export const NOTE_NOTES_MAX_LENGTH = 5000
export const NOTE_TAG_MAX_COUNT = 12
export const NOTE_TAG_MAX_LENGTH = 40
export const NOTE_MEDIA_REFERENCE_PREFIX = "inspira-media:"

export interface CreateNoteInput {
  title?: string
  content: string
  notes?: string
  tags?: string[]
  /** Workspaces this note joins. Omitted or empty means no workspace. */
  workspaceIds?: string[]
  /**
   * Single-workspace legacy entry point. Normalized into `workspaceIds` before
   * use so older callers keep working; new callers should send `workspaceIds`.
   */
  workspaceId?: string
}

export interface UpdateNoteInput extends CreateNoteInput {
  id: string
}

/**
 * One stored content item as returned by list and detail queries. `type` covers
 * every kind so captures (page / image / quote) are readable through the same
 * queries as notes; the capture-only fields stay optional.
 */
export interface InspirationItem {
  id: string
  type: InspirationType
  title?: string
  content: string
  notes?: string
  tags: string[]
  /** Workspaces this item belongs to. Always an array; `[]` means none. */
  workspaceIds: string[]
  /** Capture-only: source page of a page / quote / image item. */
  sourceUrl?: string
  primaryAssetId?: string
  primaryAssetUrl?: string
  pageSnapshotId?: string
  pageSnapshot?: PageSnapshotView
  mediaStatus?: MediaAssetStatus
  mediaAssets?: Record<string, MediaAssetView>
  /** Capture-only: the selected text behind a quote item. */
  selectedText?: string
  /** Capture-only: client clock, context only. */
  capturedAt?: number
  createdAt: number
  updatedAt: number
}

export function createNoteMediaReference(
  assetId: string,
  alt = "Inspira media"
) {
  return `![${alt}](${NOTE_MEDIA_REFERENCE_PREFIX}${assetId})`
}

export function extractNoteMediaAssetIds(content: string) {
  const ids = new Set<string>()
  const escapedPrefix = NOTE_MEDIA_REFERENCE_PREFIX.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  )
  const pattern = new RegExp(
    `!\\[[^\\]]*\\]\\(${escapedPrefix}([^\\s)]+)\\)`,
    "g"
  )

  for (const match of content.matchAll(pattern)) {
    ids.add(match[1])
  }

  return Array.from(ids)
}
