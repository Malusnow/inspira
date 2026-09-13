import { saveCapture } from "~/lib/backend"
import {
  queryActiveTab,
  readPageSnapshot,
  type PageSnapshot
} from "~/lib/browser"
import type { CaptureIntent, CaptureOutcome } from "~/lib/messages"

const SOURCE_UNAVAILABLE_MESSAGE = "这个页面不支持读取内容。"

function failed(): CaptureOutcome {
  return {
    status: "failed",
    code: "SOURCE_UNAVAILABLE",
    message: SOURCE_UNAVAILABLE_MESSAGE
  }
}

/** One user action gets one id; only a transport retry may reuse it. */
export function createClientRequestId() {
  return crypto.randomUUID()
}

function isCapturableUrl(url: string | undefined): url is string {
  if (!url) {
    return false
  }

  try {
    const { protocol } = new URL(url)

    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Resolves a possibly relative address and drops anything that is not http(s),
 * so a `data:` or relative `og:image` never fails the whole capture.
 */
function toCapturableUrl(
  value: string | undefined,
  base: string | undefined
): string | undefined {
  if (!value) {
    return undefined
  }

  try {
    const resolved = base
      ? new URL(value, base).toString()
      : new URL(value).toString()

    return isCapturableUrl(resolved) ? resolved : undefined
  } catch {
    return undefined
  }
}

/** Clicking the toolbar icon captures the active page. */
export async function captureActivePage(): Promise<CaptureOutcome> {
  const tab = await queryActiveTab()

  if (!tab?.id || !isCapturableUrl(tab.url)) {
    return failed()
  }

  let snapshot: PageSnapshot = {}

  try {
    snapshot = await readPageSnapshot(tab.id)
  } catch {
    // chrome://, the Web Store and protected pages cannot be injected into.
    return failed()
  }

  return saveCapture({
    clientRequestId: createClientRequestId(),
    kind: "page",
    sourceUrl: tab.url,
    pageTitle: snapshot.title,
    description: snapshot.description,
    snapshotHtml: snapshot.html,
    capturedAt: Date.now()
  })
}

/** Context menu on a selection; needs no injected reader. */
async function captureSelectionIntent(
  intent: Extract<CaptureIntent, { kind: "quote" }>
): Promise<CaptureOutcome> {
  const sourceUrl = isCapturableUrl(intent.sourceUrl)
    ? intent.sourceUrl
    : undefined
  const selectedText = intent.selectedText.trim()

  if (!sourceUrl || !selectedText) {
    return failed()
  }

  return saveCapture({
    clientRequestId: createClientRequestId(),
    kind: "quote",
    sourceUrl,
    pageTitle: intent.pageTitle,
    selectedText,
    capturedAt: Date.now()
  })
}

/** Context menu on an image; the backend transfers it into managed media. */
async function captureImageIntent(
  intent: Extract<CaptureIntent, { kind: "image" }>
): Promise<CaptureOutcome> {
  const sourceUrl = isCapturableUrl(intent.sourceUrl)
    ? intent.sourceUrl
    : undefined
  const resolvedImageUrl = toCapturableUrl(intent.imageUrl, sourceUrl)

  if (!resolvedImageUrl) {
    return failed()
  }

  return saveCapture({
    clientRequestId: createClientRequestId(),
    kind: "image",
    imageUrl: resolvedImageUrl,
    sourceUrl,
    pageTitle: intent.pageTitle,
    capturedAt: Date.now()
  })
}

export async function captureIntent(
  intent: CaptureIntent
): Promise<CaptureOutcome> {
  switch (intent.kind) {
    case "page":
      return await captureActivePage()
    case "quote":
      return await captureSelectionIntent(intent)
    case "image":
      return await captureImageIntent(intent)
  }
}
