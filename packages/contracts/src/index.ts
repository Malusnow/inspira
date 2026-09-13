export type InspirationType = "page" | "image" | "quote" | "note" | "video"

export const NOTE_TITLE_MAX_LENGTH = 120
export const NOTE_CONTENT_MAX_LENGTH = 10000
export const NOTE_NOTES_MAX_LENGTH = 5000
export const NOTE_TAG_MAX_COUNT = 12
export const NOTE_TAG_MAX_LENGTH = 40
export const WORKSPACE_NAME_MAX_LENGTH = 60
/**
 * Upper bound on how many workspaces a single inspiration may belong to. Kept
 * in sync with the picker UI, which renders the memberships in a scroll list.
 */
export const INSPIRATION_WORKSPACE_MAX_COUNT = 12
export const MEDIA_IMAGE_MAX_BYTES = 20 * 1024 * 1024
export const MEDIA_PAGE_HTML_MAX_BYTES = 2 * 1024 * 1024
export const NOTE_MEDIA_REFERENCE_PREFIX = "inspira-media:"

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

/**
 * Plugin capture is limited to these three entry points. Web Note editing and
 * Video upload do not use the capture protocol; see docs/CONTRACTS.md.
 */
export type CaptureKind = Extract<InspirationType, "page" | "image" | "quote">

export const CAPTURE_KINDS: readonly CaptureKind[] = ["page", "image", "quote"]

export const CAPTURE_CLIENT_REQUEST_ID_MAX_LENGTH = 128
export const CAPTURE_SOURCE_URL_MAX_LENGTH = 2048
export const CAPTURE_PAGE_TITLE_MAX_LENGTH = 300
export const CAPTURE_DESCRIPTION_MAX_LENGTH = 1000
export const CAPTURE_IMAGE_URL_MAX_LENGTH = 2048
/** The quote body is stored as the content body, so it shares the Note limit. */
export const CAPTURE_SELECTED_TEXT_MAX_LENGTH = NOTE_CONTENT_MAX_LENGTH
/** The captured remark is stored as `notes`, so it shares the Note limit. */
export const CAPTURE_NOTE_MAX_LENGTH = NOTE_NOTES_MAX_LENGTH

/**
 * Error codes shared by the backend and the extension popup. Each code maps to
 * a visible popup state; see docs/CONTRACTS.md and the capture spec.
 */
export const CAPTURE_ERROR_CODES = [
  "UNAUTHENTICATED",
  "INVALID_INPUT",
  "WORKSPACE_UNAVAILABLE",
  "SOURCE_UNAVAILABLE",
  "REQUEST_CONFLICT",
  "TEMPORARY_FAILURE"
] as const

export type CaptureErrorCode = (typeof CAPTURE_ERROR_CODES)[number]

/**
 * Raw capture input as received from a client. Every field is optional and
 * `kind` is a plain string so that runtime validation has something to reject.
 */
export interface CaptureRequestInput {
  clientRequestId?: string
  kind?: string
  /** Required for page and quote; recommended for image as the source page. */
  sourceUrl?: string
  pageTitle?: string
  /** Page summary read from the injected reader; stored as page content. */
  description?: string
  /** Required for quote. */
  selectedText?: string
  /** Required for image. */
  imageUrl?: string
  /** Page capture: static sanitized HTML snapshot to store as managed media. */
  snapshotHtml?: string
  /** User remark; stored on the content's `notes` field. */
  note?: string
  /**
   * Workspaces to join. Every id must belong to the current owner and is
   * validated against the DB on write.
   */
  workspaceIds?: string[]
  /**
   * Single-workspace legacy entry point. Normalized into `workspaceIds` before
   * validation; new callers should send `workspaceIds`.
   */
  workspaceId?: string
  tags?: string[]
  /** Client clock, context only; never trusted for ordering. */
  capturedAt?: number
}

/**
 * A validated capture request. One `clientRequestId` belongs to one user
 * action and is reused only by transport retries of that same action; a new
 * user action must generate a new id.
 */
export interface CaptureRequest {
  clientRequestId: string
  kind: CaptureKind
  sourceUrl?: string
  pageTitle?: string
  description?: string
  selectedText?: string
  imageUrl?: string
  snapshotHtml?: string
  note?: string
  workspaceIds: string[]
  tags: string[]
  capturedAt?: number
}

export interface CaptureResult {
  inspirationId: string
  /**
   * `false` only means this request id was retried and resolved to an already
   * recorded result. It never means the same URL, image or quote was captured
   * before, and it never blocks a deliberate repeat capture.
   */
  created: boolean
}

/** Thrown by `normalizeCaptureRequest`; the backend maps it to `INVALID_INPUT`. */
export class CaptureValidationError extends Error {
  readonly code: CaptureErrorCode = "INVALID_INPUT"

  constructor(message: string) {
    super(message)
    this.name = "CaptureValidationError"
  }
}

export class MediaValidationError extends Error {
  readonly code: CaptureErrorCode = "INVALID_INPUT"

  constructor(message: string) {
    super(message)
    this.name = "MediaValidationError"
  }
}

export function isCaptureKind(value: string): value is CaptureKind {
  return CAPTURE_KINDS.some((kind) => kind === value)
}

function cleanCaptureText(
  value: string | undefined,
  maxLength: number,
  field: string
) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return undefined
  }

  if (trimmed.length > maxLength) {
    throw new CaptureValidationError(
      `${field} must be ${maxLength} characters or fewer.`
    )
  }

  return trimmed
}

function cleanCaptureUrl(
  value: string | undefined,
  maxLength: number,
  field: string
) {
  const trimmed = cleanCaptureText(value, maxLength, field)

  if (!trimmed) {
    return undefined
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(trimmed)
  } catch {
    throw new CaptureValidationError(`${field} must be an absolute URL.`)
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new CaptureValidationError(
      `${field} must use the http or https protocol.`
    )
  }

  return trimmed
}

export function normalizeCaptureTags(tags: string[] | undefined) {
  const cleanedTags = Array.from(
    new Set(
      (tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0)
    )
  )

  if (cleanedTags.length > NOTE_TAG_MAX_COUNT) {
    throw new CaptureValidationError(`Use ${NOTE_TAG_MAX_COUNT} tags or fewer.`)
  }

  for (const tag of cleanedTags) {
    if (tag.length > NOTE_TAG_MAX_LENGTH) {
      throw new CaptureValidationError(
        `Tags must be ${NOTE_TAG_MAX_LENGTH} characters or fewer.`
      )
    }
  }

  return cleanedTags
}

function normalizeCaptureWorkspaceIds(input: {
  workspaceIds?: string[]
  workspaceId?: string
}) {
  try {
    return normalizeWorkspaceIds(input)
  } catch (error) {
    if (error instanceof WorkspaceIdsValidationError) {
      throw new CaptureValidationError(error.message)
    }

    throw error
  }
}

/**
 * Trims and validates capture input before any write. Throws
 * `CaptureValidationError` when the request is invalid, and never derives or
 * trusts an owner: ownership comes from the verified server session only.
 */
export function normalizeCaptureRequest(
  input: CaptureRequestInput
): CaptureRequest {
  if (!input.kind || !isCaptureKind(input.kind)) {
    throw new CaptureValidationError(
      `kind must be one of ${CAPTURE_KINDS.join(", ")}.`
    )
  }

  const clientRequestId = cleanCaptureText(
    input.clientRequestId,
    CAPTURE_CLIENT_REQUEST_ID_MAX_LENGTH,
    "clientRequestId"
  )

  if (!clientRequestId) {
    throw new CaptureValidationError("clientRequestId is required.")
  }

  const sourceUrl = cleanCaptureUrl(
    input.sourceUrl,
    CAPTURE_SOURCE_URL_MAX_LENGTH,
    "sourceUrl"
  )
  const selectedText = cleanCaptureText(
    input.selectedText,
    CAPTURE_SELECTED_TEXT_MAX_LENGTH,
    "selectedText"
  )
  const imageUrl = cleanCaptureUrl(
    input.imageUrl,
    CAPTURE_IMAGE_URL_MAX_LENGTH,
    "imageUrl"
  )

  if (input.kind === "page" && !sourceUrl) {
    throw new CaptureValidationError(
      "sourceUrl is required for a page capture."
    )
  }

  if (input.kind === "quote") {
    if (!selectedText) {
      throw new CaptureValidationError(
        "selectedText is required for a quote capture."
      )
    }

    if (!sourceUrl) {
      throw new CaptureValidationError(
        "sourceUrl is required for a quote capture."
      )
    }
  }

  if (input.kind === "image" && !imageUrl) {
    throw new CaptureValidationError(
      "imageUrl is required for an image capture."
    )
  }

  const snapshotHtml = cleanCaptureText(
    input.snapshotHtml,
    MEDIA_PAGE_HTML_MAX_BYTES,
    "snapshotHtml"
  )

  if (input.capturedAt !== undefined && !Number.isFinite(input.capturedAt)) {
    throw new CaptureValidationError("capturedAt must be a finite timestamp.")
  }

  return {
    clientRequestId,
    kind: input.kind,
    sourceUrl,
    pageTitle: cleanCaptureText(
      input.pageTitle,
      CAPTURE_PAGE_TITLE_MAX_LENGTH,
      "pageTitle"
    ),
    description: cleanCaptureText(
      input.description,
      CAPTURE_DESCRIPTION_MAX_LENGTH,
      "description"
    ),
    selectedText,
    imageUrl,
    snapshotHtml,
    note: cleanCaptureText(input.note, CAPTURE_NOTE_MAX_LENGTH, "note"),
    // Workspace ids are opaque Convex ids: normalized only for emptiness,
    // duplicates and count. Existence and ownership are validated in the backend.
    workspaceIds: normalizeCaptureWorkspaceIds(input),
    tags: normalizeCaptureTags(input.tags),
    capturedAt: input.capturedAt
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

export interface WorkspacePreviewItem {
  id: string
  type: InspirationType
  title?: string
  text?: string
  primaryAssetUrl?: string
  pageSnapshotUrl?: string
  createdAt: number
}

/** Thumbnails only: counts live on `WorkspaceSummary.itemCount`. */
export interface WorkspacePreview {
  items: WorkspacePreviewItem[]
}

export interface WorkspaceSummary {
  id: string
  name: string
  itemCount: number
  preview: WorkspacePreview
  createdAt: number
  updatedAt: number
}

export interface WorkspaceDetail {
  id: string
  name: string
  items: InspirationItem[]
  createdAt: number
  updatedAt: number
}

export function normalizeWorkspaceName(name: string) {
  return name.trim()
}

export function getWorkspaceNameKey(name: string) {
  return normalizeWorkspaceName(name).toLocaleLowerCase()
}

export function validateWorkspaceName(name: string) {
  const normalizedName = normalizeWorkspaceName(name)

  if (!normalizedName) {
    throw new Error("Workspace name is required.")
  }

  if (normalizedName.length > WORKSPACE_NAME_MAX_LENGTH) {
    throw new Error(
      `Workspace name must be ${WORKSPACE_NAME_MAX_LENGTH} characters or fewer.`
    )
  }

  return normalizedName
}

/** Thrown by `normalizeWorkspaceIds`; the backend maps it to `INVALID_INPUT`. */
export class WorkspaceIdsValidationError extends Error {
  readonly code = "INVALID_INPUT" as const

  constructor(message: string) {
    super(message)
    this.name = "WorkspaceIdsValidationError"
  }
}

/**
 * Cleans a workspace id list before any ownership check. Drops falsy and empty
 * entries, de-duplicates, and enforces `INSPIRATION_WORKSPACE_MAX_COUNT`.
 * Convex ids are opaque, so they are never trimmed or truncated here; existence
 * and ownership are validated against the DB in the backend handler.
 */
export function normalizeWorkspaceIds(input: {
  workspaceIds?: string[]
  workspaceId?: string
}): string[] {
  const candidates = [...(input.workspaceIds ?? []), input.workspaceId]
  const workspaceIds = Array.from(
    new Set(
      candidates.filter(
        (id): id is string => typeof id === "string" && id.length > 0
      )
    )
  )

  if (workspaceIds.length > INSPIRATION_WORKSPACE_MAX_COUNT) {
    throw new WorkspaceIdsValidationError(
      `Use ${INSPIRATION_WORKSPACE_MAX_COUNT} workspaces or fewer.`
    )
  }

  return workspaceIds
}

export const INSIGHTS_TYPE_ORDER: readonly InspirationType[] = [
  "page",
  "image",
  "quote",
  "note",
  "video"
]

export const INSIGHTS_HEATMAP_WINDOW_DAYS = 365
export const INSIGHTS_ACTIVE_WINDOW_DAYS = 30
export const INSIGHTS_TOP_TAG_LIMIT = 5
/** Monday, matching the Settings prototype's default week start. */
export const INSIGHTS_WEEK_START_DAY = 1

export interface InsightDayCount {
  /** Local calendar day as `YYYY-MM-DD`, resolved in the requested time zone. */
  date: string
  count: number
}

export interface InsightTypeCount {
  type: InspirationType
  count: number
}

export interface InsightTagCount {
  tag: string
  count: number
}

export interface InsightsSummary {
  totalCount: number
  createdThisMonth: number
  createdLastMonth: number
  createdThisWeek: number
  createdLastWeek: number
  /** Distinct days with at least one creation inside the active window. */
  activeDayCount: number
  /** One entry per local day across the heatmap window, ascending, zero filled. */
  dailyCounts: InsightDayCount[]
  typeCounts: InsightTypeCount[]
  topTags: InsightTagCount[]
}

/** Minimal projection of an `inspirations` row needed to aggregate insights. */
export interface InsightSourceItem {
  createdAt: number
  type: InspirationType
  tags: string[]
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const dateKeyFormatters = new Map<string, Intl.DateTimeFormat>()

function getDateKeyFormatter(timeZone: string) {
  const cached = dateKeyFormatters.get(timeZone)

  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })

  dateKeyFormatters.set(timeZone, formatter)

  return formatter
}

/** Falls back to UTC when the client sends a missing or unknown time zone. */
export function normalizeInsightsTimeZone(timeZone?: string) {
  const candidate = timeZone?.trim()

  if (!candidate) {
    return "UTC"
  }

  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: candidate })

    return candidate
  } catch {
    return "UTC"
  }
}

/** Local calendar day (`YYYY-MM-DD`) of a timestamp in the given IANA time zone. */
export function getInsightsDateKey(timestamp: number, timeZone: string) {
  const parts = getDateKeyFormatter(timeZone).formatToParts(timestamp)
  let year = ""
  let month = ""
  let day = ""

  for (const part of parts) {
    if (part.type === "year") {
      year = part.value
    } else if (part.type === "month") {
      month = part.value
    } else if (part.type === "day") {
      day = part.value
    }
  }

  return `${year}-${month}-${day}`
}

/**
 * Date keys are `YYYY-MM-DD`, so they sort lexicographically and plain day
 * arithmetic can run on a UTC representation of the same calendar day.
 */
export function shiftInsightsDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-")
  const shifted =
    Date.UTC(Number(year), Number(month) - 1, Number(day)) + days * MS_PER_DAY

  return new Date(shifted).toISOString().slice(0, 10)
}

export function getInsightsWeekStartDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-")
  const weekday = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  ).getUTCDay()
  const offset = (weekday - INSIGHTS_WEEK_START_DAY + 7) % 7

  return shiftInsightsDateKey(dateKey, -offset)
}

export function buildInsightsDateKeys(endDateKey: string, days: number) {
  const dateKeys: string[] = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    dateKeys.push(shiftInsightsDateKey(endDateKey, -offset))
  }

  return dateKeys
}

function getMonthKey(dateKey: string) {
  return dateKey.slice(0, 7)
}

function shiftMonthKey(monthKey: string, months: number) {
  const year = Number(monthKey.slice(0, 4))
  const month = Number(monthKey.slice(5, 7))
  const totalMonths = year * 12 + (month - 1) + months
  const shiftedYear = Math.floor(totalMonths / 12)
  const shiftedMonth = (totalMonths % 12) + 1

  return `${String(shiftedYear).padStart(4, "0")}-${String(shiftedMonth).padStart(2, "0")}`
}

/**
 * Aggregates the owner's current rows. Deletions leave the set immediately, so
 * every figure on the Insights surface describes the same living collection.
 * Day/week/month boundaries are resolved in `timeZone`, which is why the
 * aggregate is computed server-side from a client-supplied IANA zone.
 */
export function buildInsightsSummary(
  items: readonly InsightSourceItem[],
  now: number,
  timeZone?: string
): InsightsSummary {
  const resolvedTimeZone = normalizeInsightsTimeZone(timeZone)
  const todayKey = getInsightsDateKey(now, resolvedTimeZone)
  const weekStartKey = getInsightsWeekStartDateKey(todayKey)
  const previousWeekStartKey = shiftInsightsDateKey(weekStartKey, -7)
  const currentMonthKey = getMonthKey(todayKey)
  const previousMonthKey = shiftMonthKey(currentMonthKey, -1)
  const heatmapDateKeys = buildInsightsDateKeys(
    todayKey,
    INSIGHTS_HEATMAP_WINDOW_DAYS
  )
  const activeWindowStartKey =
    heatmapDateKeys[heatmapDateKeys.length - INSIGHTS_ACTIVE_WINDOW_DAYS] ??
    heatmapDateKeys[0] ??
    todayKey
  const dailyCounts = new Map<string, number>()
  const typeCounts = new Map<InspirationType, number>()
  const tagCounts = new Map<string, number>()

  for (const dateKey of heatmapDateKeys) {
    dailyCounts.set(dateKey, 0)
  }

  for (const type of INSIGHTS_TYPE_ORDER) {
    typeCounts.set(type, 0)
  }

  let createdThisMonth = 0
  let createdLastMonth = 0
  let createdThisWeek = 0
  let createdLastWeek = 0

  for (const item of items) {
    typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1)

    const itemDateKey = getInsightsDateKey(item.createdAt, resolvedTimeZone)
    const itemMonthKey = getMonthKey(itemDateKey)

    if (itemMonthKey === currentMonthKey) {
      createdThisMonth += 1
    } else if (itemMonthKey === previousMonthKey) {
      createdLastMonth += 1
    }

    if (itemDateKey >= weekStartKey) {
      createdThisWeek += 1
    } else if (itemDateKey >= previousWeekStartKey) {
      createdLastWeek += 1
    }

    if (dailyCounts.has(itemDateKey)) {
      dailyCounts.set(itemDateKey, (dailyCounts.get(itemDateKey) ?? 0) + 1)
    }

    // One content contributes at most once per distinct tag.
    for (const tag of new Set(item.tags)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  let activeDayCount = 0

  for (const dateKey of heatmapDateKeys) {
    if (dateKey < activeWindowStartKey) {
      continue
    }

    if ((dailyCounts.get(dateKey) ?? 0) > 0) {
      activeDayCount += 1
    }
  }

  return {
    totalCount: items.length,
    createdThisMonth,
    createdLastMonth,
    createdThisWeek,
    createdLastWeek,
    activeDayCount,
    dailyCounts: heatmapDateKeys.map((date) => ({
      date,
      count: dailyCounts.get(date) ?? 0
    })),
    typeCounts: INSIGHTS_TYPE_ORDER.map((type) => ({
      type,
      count: typeCounts.get(type) ?? 0
    })),
    topTags: Array.from(tagCounts, ([tag, count]) => ({ tag, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.tag.localeCompare(right.tag)
      )
      .slice(0, INSIGHTS_TOP_TAG_LIMIT)
  }
}
