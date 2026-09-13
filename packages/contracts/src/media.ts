export const MEDIA_IMAGE_MAX_BYTES = 20 * 1024 * 1024
export const MEDIA_PAGE_HTML_MAX_BYTES = 2 * 1024 * 1024

export const MEDIA_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
] as const

export const MEDIA_ASSET_KINDS = [
  "image",
  "pageHtml",
  "pagePreview",
  "noteImage"
] as const

export const MEDIA_ASSET_USAGES = [
  "captureImage",
  "pageSnapshotHtml",
  "pageSnapshotPreview",
  "noteEmbed"
] as const

export const MEDIA_ASSET_STATUSES = [
  "uploading",
  "available",
  "failed",
  "pendingCleanup",
  "deleted"
] as const

export type MediaImageMimeType = (typeof MEDIA_IMAGE_MIME_TYPES)[number]
export type MediaAssetKind = (typeof MEDIA_ASSET_KINDS)[number]
export type MediaAssetUsage = (typeof MEDIA_ASSET_USAGES)[number]
export type MediaAssetStatus = (typeof MEDIA_ASSET_STATUSES)[number]

export interface MediaAssetView {
  id: string
  kind: MediaAssetKind
  mimeType: string
  byteSize: number
  status: MediaAssetStatus
  usage: MediaAssetUsage
  sourceUrl?: string
  url?: string
  createdAt: number
  updatedAt: number
}

export interface PageSnapshotView {
  id: string
  htmlAssetId: string
  htmlUrl?: string
  previewAssetId?: string
  previewUrl?: string
  originalUrl: string
  capturedAt: number
}

export interface RequestMediaUploadInput {
  usage: MediaAssetUsage
  kind: MediaAssetKind
  mimeType: string
  byteSize: number
  sourceUrl?: string
}

export interface RequestMediaUploadResult {
  uploadUrl: string
}

export interface FinalizeMediaUploadInput extends RequestMediaUploadInput {
  storageId: string
}

export interface FinalizeMediaUploadResult {
  assetId: string
}

export class MediaValidationError extends Error {
  readonly code = "INVALID_INPUT" as const

  constructor(message: string) {
    super(message)
    this.name = "MediaValidationError"
  }
}

export function isMediaImageMimeType(
  value: string
): value is MediaImageMimeType {
  return (MEDIA_IMAGE_MIME_TYPES as readonly string[]).includes(value)
}

export function isMediaAssetKind(value: string): value is MediaAssetKind {
  return (MEDIA_ASSET_KINDS as readonly string[]).includes(value)
}

export function isMediaAssetUsage(value: string): value is MediaAssetUsage {
  return (MEDIA_ASSET_USAGES as readonly string[]).includes(value)
}

export function getMediaByteLimit(input: {
  kind: MediaAssetKind
  usage: MediaAssetUsage
}) {
  if (input.kind === "pageHtml" && input.usage === "pageSnapshotHtml") {
    return MEDIA_PAGE_HTML_MAX_BYTES
  }

  return MEDIA_IMAGE_MAX_BYTES
}

export function validateMediaUploadIntent(input: RequestMediaUploadInput) {
  if (!isMediaAssetKind(input.kind)) {
    throw new MediaValidationError("Unsupported media kind.")
  }

  if (!isMediaAssetUsage(input.usage)) {
    throw new MediaValidationError("Unsupported media usage.")
  }

  const isPageHtml =
    input.kind === "pageHtml" && input.usage === "pageSnapshotHtml"
  const isImage =
    (input.kind === "image" && input.usage === "captureImage") ||
    (input.kind === "noteImage" && input.usage === "noteEmbed") ||
    (input.kind === "pagePreview" && input.usage === "pageSnapshotPreview")

  if (!isPageHtml && !isImage) {
    throw new MediaValidationError("Media kind and usage do not match.")
  }

  if (isPageHtml && input.mimeType !== "text/html") {
    throw new MediaValidationError("Page snapshots must use text/html.")
  }

  if (isImage && !isMediaImageMimeType(input.mimeType)) {
    throw new MediaValidationError("Unsupported image type.")
  }

  if (
    !Number.isFinite(input.byteSize) ||
    input.byteSize <= 0 ||
    input.byteSize > getMediaByteLimit(input)
  ) {
    throw new MediaValidationError("Media file is too large or empty.")
  }
}
