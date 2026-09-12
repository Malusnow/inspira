import { ConvexError, v } from "convex/values"

import type { MutationCtx, QueryCtx } from "../_generated/server"
import {
  CAPTURE_NOTE_MAX_LENGTH,
  CaptureValidationError,
  normalizeCaptureRequest,
  normalizeCaptureTags,
  type CaptureRequest,
  type CaptureRequestInput
} from "../../packages/contracts/src/index"
import { resolveOwnedWorkspaceId } from "./workspaces"

/**
 * Convex validators mirror `CaptureRequestInput` on purpose: shape-level
 * validation happens here, semantic validation happens in the shared contract
 * so the extension and the backend cannot drift apart.
 */
export const captureArgs = {
  clientRequestId: v.string(),
  kind: v.string(),
  sourceUrl: v.optional(v.string()),
  pageTitle: v.optional(v.string()),
  description: v.optional(v.string()),
  selectedText: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  note: v.optional(v.string()),
  workspaceId: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  capturedAt: v.optional(v.number())
}

/**
 * Runs the shared contract validation and re-throws contract errors as
 * ConvexError so callers receive the documented `INVALID_INPUT` code.
 */
export function cleanCapture(args: CaptureRequestInput): CaptureRequest {
  try {
    return normalizeCaptureRequest(args)
  } catch (error) {
    if (error instanceof CaptureValidationError) {
      throw new ConvexError({ code: error.code, message: error.message })
    }

    throw error
  }
}

/**
 * Stable fingerprint of everything that defines the captured content. The
 * client clock is excluded so a retry that only differs by timestamp still
 * resolves to the same content. Field order is fixed here, not by the caller.
 */
export function buildCapturePayload(request: CaptureRequest) {
  return JSON.stringify({
    kind: request.kind,
    sourceUrl: request.sourceUrl ?? null,
    pageTitle: request.pageTitle ?? null,
    description: request.description ?? null,
    selectedText: request.selectedText ?? null,
    imageUrl: request.imageUrl ?? null,
    note: request.note ?? null,
    workspaceId: request.workspaceId ?? null,
    tags: request.tags
  })
}

export async function hashCapturePayload(payload: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload)
  )

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Maps a validated request onto stored columns. Captures share one table with
 * notes, so `title` and `content` always carry something meaningful:
 * page keeps its URL as content, quote keeps the selected text, image keeps the
 * remote address until media transfer exists (D04).
 */
export function buildCaptureColumns(request: CaptureRequest): {
  title: string
  content: string
  sourceUrl?: string
  selectedText?: string
  imageUrl?: string
} {
  switch (request.kind) {
    case "page":
      return {
        title: request.pageTitle ?? request.sourceUrl ?? "",
        content: request.description ?? request.sourceUrl ?? "",
        sourceUrl: request.sourceUrl,
        imageUrl: request.imageUrl
      }
    case "quote":
      return {
        title: request.pageTitle ?? request.sourceUrl ?? "",
        content: request.selectedText ?? "",
        sourceUrl: request.sourceUrl,
        selectedText: request.selectedText
      }
    case "image":
      return {
        title: request.pageTitle ?? request.imageUrl ?? "",
        content: request.imageUrl ?? "",
        sourceUrl: request.sourceUrl,
        imageUrl: request.imageUrl
      }
    default: {
      const unsupportedKind: never = request.kind

      throw new ConvexError({
        code: "INVALID_INPUT",
        message: `Unsupported capture kind: ${String(unsupportedKind)}`
      })
    }
  }
}

/**
 * Validates the fields the popup edits after a capture. `undefined` means
 * "leave unchanged", so the popup can send tags and the remark independently.
 */
export function cleanCaptureDetails(args: { tags?: string[]; note?: string }) {
  try {
    return {
      tags:
        args.tags === undefined ? undefined : normalizeCaptureTags(args.tags),
      notes:
        args.note === undefined ? undefined : normalizeCaptureNote(args.note)
    }
  } catch (error) {
    if (error instanceof CaptureValidationError) {
      throw new ConvexError({ code: error.code, message: error.message })
    }

    throw error
  }
}

function normalizeCaptureNote(note: string) {
  const trimmed = note.trim()

  if (!trimmed) {
    return undefined
  }

  if (trimmed.length > CAPTURE_NOTE_MAX_LENGTH) {
    throw new CaptureValidationError(
      `note must be ${CAPTURE_NOTE_MAX_LENGTH} characters or fewer.`
    )
  }

  return trimmed
}

/**
 * Resolves the optional workspace for a capture. Capture reports a missing or
 * foreign workspace as `WORKSPACE_UNAVAILABLE` instead of the note-specific
 * `INVALID_INPUT`, matching docs/CONTRACTS.md.
 */
export async function resolveCaptureWorkspaceId(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  workspaceId: string | undefined
) {
  try {
    return await resolveOwnedWorkspaceId(ctx, ownerId, workspaceId)
  } catch {
    throw new ConvexError({
      code: "WORKSPACE_UNAVAILABLE",
      message: "Workspace is not available."
    })
  }
}
