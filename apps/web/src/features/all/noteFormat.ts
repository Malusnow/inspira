/**
 * Pure helpers for the All note surface.
 *
 * Kept free of Convex / React so they can be unit-tested and reused without
 * coupling to components.
 */

export function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value)
}

export function formatRelativeTimestamp(value: number) {
  const diff = Date.now() - value
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return "Just now"
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`
  if (diff < day) return `${Math.floor(diff / hour)} hr ago`
  if (diff < 2 * day) return "Yesterday"
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(value)
}

export function formatDetailTimestamp(value: number) {
  const diff = Date.now() - value
  const day = 24 * 60 * 60 * 1000

  if (diff >= 0 && diff < day) {
    return formatRelativeTimestamp(value)
  }

  return formatTimestamp(value)
}

export function getNoteTone(id: string) {
  const tones = [
    "bg-note-paper",
    "bg-note-sage",
    "bg-note-warm",
    "bg-note-blue"
  ]
  const index = Array.from(id).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  )

  return tones[index % tones.length]
}

/**
 * Parse a comma-/space-separated tag text input into a de-duplicated, trimmed,
 * non-empty tag array (matches backend NOTE tag normalization).
 */
export function parseTagText(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
  )
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Something went wrong."
}
