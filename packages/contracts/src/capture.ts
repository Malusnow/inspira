import type { InspirationType } from "./content"
import { MEDIA_PAGE_HTML_MAX_BYTES } from "./media"
import {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_NOTES_MAX_LENGTH,
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH
} from "./notes"
import {
  normalizeWorkspaceIds,
  WorkspaceIdsValidationError
} from "./workspaces"

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
