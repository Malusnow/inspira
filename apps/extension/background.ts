import { getAuthStatus, updateCaptureDetails } from "~/lib/backend"
import {
  contextMenu,
  extensionStorage,
  onInstalled,
  onRuntimeMessage,
  openPopup,
  setBadgeText
} from "~/lib/browser"
import { captureIntent } from "~/lib/capture"
import {
  isExtensionRequest,
  PENDING_CAPTURE_INTENT_KEY,
  type CaptureIntent,
  type ExtensionResponse
} from "~/lib/messages"

const MENU_SAVE_QUOTE = "inspira-save-quote"
const MENU_SAVE_IMAGE = "inspira-save-image"

/** Auto-open failed (old Chrome), so the badge asks the user to click instead. */
const BADGE_PENDING = "..."
const BADGE_FAILED = "!"

/** Both entries carry the product label; the context is what tells them apart. */
const MENU_TITLE = "Add to Inspira"

function registerContextMenus() {
  contextMenu.removeAll()
  contextMenu.create({
    id: MENU_SAVE_QUOTE,
    title: MENU_TITLE,
    contexts: ["selection"]
  })
  contextMenu.create({
    id: MENU_SAVE_IMAGE,
    title: MENU_TITLE,
    contexts: ["image"]
  })
}

onInstalled(registerContextMenus)

async function storeContextIntent(intent: CaptureIntent) {
  try {
    await extensionStorage.set(PENDING_CAPTURE_INTENT_KEY, intent)
  } catch {
    setBadgeText(BADGE_FAILED)
    return
  }

  setBadgeText("")

  if (await openPopup()) {
    return
  }
  // Chrome can refuse programmatic popup opening. The action is still queued;
  // clicking the toolbar icon will consume it and show the normal UI.
  setBadgeText(BADGE_PENDING)
}

contextMenu.onClicked((info, tab) => {
  setBadgeText("")

  void (async () => {
    const sourceUrl = tab?.url
    const pageTitle = tab?.title
    const intent: CaptureIntent | undefined =
      info.menuItemId === MENU_SAVE_QUOTE
        ? info.selectionText && sourceUrl
          ? {
              kind: "quote",
              sourceUrl,
              selectedText: info.selectionText,
              pageTitle
            }
          : undefined
        : info.srcUrl
          ? { kind: "image", imageUrl: info.srcUrl, sourceUrl, pageTitle }
          : undefined

    if (!intent) {
      setBadgeText(BADGE_FAILED)
      return
    }

    await storeContextIntent(intent)
  })()
})

onRuntimeMessage(async (message): Promise<ExtensionResponse> => {
  if (!isExtensionRequest(message)) {
    return { ok: false, message: "Unsupported message." }
  }

  switch (message.type) {
    case "auth-status":
      return {
        ok: true,
        type: "auth-status",
        authStatus: await getAuthStatus()
      }

    case "capture-intent":
      return {
        ok: true,
        type: "capture-intent",
        outcome: await captureIntent(message.intent)
      }

    case "update-details":
      return {
        ok: true,
        type: "update-details",
        saved: await updateCaptureDetails(
          message.inspirationId,
          message.tags,
          message.note
        )
      }
  }
})

export {}
