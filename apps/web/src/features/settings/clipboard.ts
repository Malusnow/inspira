export async function copyTextToClipboard(text: string) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall back below for browsers or permission states that reject Clipboard API.
    }
  }

  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.setAttribute("readonly", "")
  textArea.style.position = "fixed"
  textArea.style.top = "-9999px"
  textArea.style.left = "-9999px"
  document.body.append(textArea)
  textArea.select()

  try {
    return document.execCommand("copy")
  } finally {
    textArea.remove()
  }
}
