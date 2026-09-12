import type { CaptureErrorCode } from "@inspira/contracts"

/** Sign-in state as seen by the extension, not a server response. */
export type AuthStatus = "authenticated" | "anonymous" | "unknown"

export type CaptureIntent =
  | { kind: "page" }
  | {
      kind: "quote"
      sourceUrl: string
      selectedText: string
      pageTitle?: string
    }
  | {
      kind: "image"
      imageUrl: string
      sourceUrl?: string
      pageTitle?: string
    }

/** Result of one capture attempt, already mapped to a popup state. */
export type CaptureOutcome =
  | { status: "saved"; inspirationId: string; created: boolean }
  | { status: "unauthorized" }
  | { status: "failed"; code: CaptureErrorCode; message: string }

export type ExtensionRequest =
  | { type: "auth-status" }
  | { type: "capture-intent"; intent: CaptureIntent }
  | {
      type: "update-details"
      inspirationId: string
      tags: string[]
      note?: string
    }

export type ExtensionResponse =
  | { ok: true; type: "auth-status"; authStatus: AuthStatus }
  | { ok: true; type: "capture-intent"; outcome: CaptureOutcome }
  | { ok: true; type: "update-details"; saved: boolean }
  | { ok: false; message: string }

/**
 * Session-storage key for a user action that should be presented by the popup.
 * Context-menu actions start in the worker, but the visible popup owns the
 * state transitions and success inputs, so the worker stores the intent and
 * asks Chrome to open the popup.
 */
export const PENDING_CAPTURE_INTENT_KEY = "inspira_pending_capture_intent"

function isCaptureOutcome(value: unknown): value is CaptureOutcome {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as {
    status?: unknown
    inspirationId?: unknown
    code?: unknown
  }

  switch (candidate.status) {
    case "saved":
      return typeof candidate.inspirationId === "string"
    case "unauthorized":
      return true
    case "failed":
      return typeof candidate.code === "string"
    default:
      return false
  }
}

export function isCaptureIntent(value: unknown): value is CaptureIntent {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as {
    kind?: unknown
    sourceUrl?: unknown
    selectedText?: unknown
    pageTitle?: unknown
    imageUrl?: unknown
  }

  switch (candidate.kind) {
    case "page":
      return true
    case "quote":
      return (
        typeof candidate.sourceUrl === "string" &&
        typeof candidate.selectedText === "string" &&
        (candidate.pageTitle === undefined ||
          typeof candidate.pageTitle === "string")
      )
    case "image":
      return (
        typeof candidate.imageUrl === "string" &&
        (candidate.sourceUrl === undefined ||
          typeof candidate.sourceUrl === "string") &&
        (candidate.pageTitle === undefined ||
          typeof candidate.pageTitle === "string")
      )
    default:
      return false
  }
}

/**
 * Runtime validation at the message boundary. Every sender is another context
 * of this extension, but `update-details` carries the id the write is applied
 * to, so its payload is checked instead of trusted.
 */
export function isExtensionRequest(
  message: unknown
): message is ExtensionRequest {
  if (typeof message !== "object" || message === null) {
    return false
  }

  const candidate = message as {
    type?: unknown
    intent?: unknown
    inspirationId?: unknown
    tags?: unknown
    note?: unknown
  }

  switch (candidate.type) {
    case "auth-status":
      return true
    case "capture-intent":
      return isCaptureIntent(candidate.intent)
    case "update-details":
      return (
        typeof candidate.inspirationId === "string" &&
        candidate.inspirationId.trim().length > 0 &&
        Array.isArray(candidate.tags) &&
        candidate.tags.every((tag) => typeof tag === "string") &&
        (candidate.note === undefined || typeof candidate.note === "string")
      )
    default:
      return false
  }
}
