/**
 * Pure helpers for the Everything (note) library surface.
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
