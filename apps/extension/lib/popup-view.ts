import { type CaptureErrorCode } from "@inspira/contracts"

import { extensionStorage } from "~/lib/browser"
import {
  isCaptureIntent,
  PENDING_CAPTURE_INTENT_KEY,
  type CaptureIntent,
  type CaptureOutcome,
  type ExtensionResponse
} from "~/lib/messages"

export type PopupView =
  | { kind: "preparing" }
  | { kind: "saving" }
  | { kind: "signin" }
  | { kind: "saved"; inspirationId: string }
  | { kind: "failed"; message: string; canRetry: boolean }

/** Developer-facing server messages are not shown; each code has its own copy. */
const FAILURE_COPY: Record<CaptureErrorCode, string> = {
  UNAUTHENTICATED: "请先登录，再重新保存这一条。",
  INVALID_INPUT: "这条内容不完整，无法保存。",
  WORKSPACE_UNAVAILABLE: "目标工作区不可用，无法保存。",
  SOURCE_UNAVAILABLE: "这个页面不支持读取内容，或网络暂时不可用。",
  REQUEST_CONFLICT: "保存请求冲突，请重新保存。",
  TEMPORARY_FAILURE: "网络暂时不可用。"
}

/** Used when the outcome is not retryable, so the user has to act again. */
export const MANUAL_RETRY_HINT = " 请重新保存这一条。"

export function outcomeToView(
  outcome: CaptureOutcome,
  canRetry: boolean
): PopupView {
  switch (outcome.status) {
    case "saved":
      return { kind: "saved", inspirationId: outcome.inspirationId }
    case "unauthorized":
      return { kind: "signin" }
    case "failed":
      return {
        kind: "failed",
        message: FAILURE_COPY[outcome.code] ?? outcome.message,
        canRetry
      }
  }
}

/** The popup reacted to a worker response to `capture-intent`. */
export function responseToView(response: ExtensionResponse): PopupView {
  if (response.ok === false) {
    return {
      kind: "failed",
      message: response.message || FAILURE_COPY.TEMPORARY_FAILURE,
      canRetry: true
    }
  }

  if (response.type !== "capture-intent") {
    return {
      kind: "failed",
      message: FAILURE_COPY.TEMPORARY_FAILURE,
      canRetry: true
    }
  }

  return outcomeToView(response.outcome, true)
}

/**
 * Consumes a context-menu intent, if any. Reading once and removing keeps the
 * toolbar click meaningful: a pending right-click action runs first, otherwise
 * the icon click starts a fresh page capture.
 */
export async function takePendingCaptureIntent(): Promise<
  CaptureIntent | undefined
> {
  try {
    const stored = await extensionStorage.get<unknown>(
      PENDING_CAPTURE_INTENT_KEY
    )

    if (stored === undefined) {
      return undefined
    }

    await extensionStorage.remove(PENDING_CAPTURE_INTENT_KEY)

    return isCaptureIntent(stored) ? stored : undefined
  } catch {
    // Storage is best-effort; a failure must not block the page capture.
    return undefined
  }
}
