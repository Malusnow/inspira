/**
 * Thin wrapper around the browser APIs the extension uses. Business code goes
 * through this module so chrome.* calls stay in one place and can be mocked.
 */
export const extensionStorage = {
  async get<T>(key: string): Promise<T | undefined> {
    const result = await chrome.storage.session.get(key)

    return result[key] as T | undefined
  },

  async set(key: string, value: unknown) {
    await chrome.storage.session.set({ [key]: value })
  },

  async remove(key: string) {
    await chrome.storage.session.remove(key)
  }
}

export function sendRuntimeMessage<T>(message: unknown): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>
}

export function onRuntimeMessage(
  handler: (
    message: unknown,
    sender: chrome.runtime.MessageSender
  ) => Promise<unknown> | unknown
) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Promise.resolve(handler(message, sender))
      .then(sendResponse)
      .catch((error: unknown) => {
        sendResponse({
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error."
        })
      })

    // Keeps the message channel open for the async handler above.
    return true
  })
}

export const contextMenu = {
  create(properties: chrome.contextMenus.CreateProperties) {
    chrome.contextMenus.create(properties)
  },

  removeAll() {
    chrome.contextMenus.removeAll()
  },

  onClicked(
    handler: (
      info: chrome.contextMenus.OnClickData,
      tab?: chrome.tabs.Tab
    ) => void
  ) {
    chrome.contextMenus.onClicked.addListener(handler)
  }
}

export function onInstalled(handler: () => void) {
  chrome.runtime.onInstalled.addListener(handler)
}

export async function openTab(url: string) {
  await chrome.tabs.create({ url })
}

export async function queryActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  return tab
}

export function setBadgeText(text: string) {
  chrome.action.setBadgeText({ text })
}

/**
 * Opens the popup from the worker, which is how a context-menu capture surfaces
 * its result. Chrome only allows this from a user gesture and only in recent
 * versions, so callers fall back to a badge when this returns false.
 */
export async function openPopup(): Promise<boolean> {
  const action = chrome.action as unknown as {
    openPopup?: () => Promise<void>
  }

  if (typeof action.openPopup !== "function") {
    return false
  }

  try {
    await action.openPopup()

    return true
  } catch {
    return false
  }
}

export type PageSnapshot = {
  title?: string
  description?: string
  imageUrl?: string
}

/**
 * Reads the page metadata a `page` capture needs. Injected on demand so the
 * extension does not ship a persistent content script.
 */
export async function readPageSnapshot(tabId: number): Promise<PageSnapshot> {
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const readMeta = (name: string) =>
        document
          .querySelector<HTMLMetaElement>(
            `meta[property="${name}"], meta[name="${name}"]`
          )
          ?.content?.trim() || undefined

      return {
        title: document.title?.trim() || undefined,
        description: readMeta("og:description") ?? readMeta("description"),
        imageUrl: readMeta("og:image")
      }
    }
  })

  return (injection?.result as PageSnapshot | undefined) ?? {}
}
