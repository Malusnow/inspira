import type { NoteInspiration } from "@inspira/contracts"

import { buildNotePreview } from "./notePreview"

/**
 * Height estimate used only to distribute cards across masonry columns.
 *
 * These numbers mirror the real typography in `NotePreview.tsx`
 * (`text-[19px]` title with `line-clamp-2`, `text-[20px]` body,
 * `text-[16px]` code with `line-clamp-5`, `max-h-[220px]` block area).
 * They do not need to be exact, but if that file's type scale or clamps change,
 * update the constants here so columns stay balanced.
 */
const CARD_BASE_HEIGHT = 64
const TITLE_LINE_HEIGHT = 24
const TITLE_CHARS_PER_LINE = 28
const TITLE_MAX_LINES = 2
const BODY_CHARS_PER_LINE = 38
const BODY_LINE_HEIGHT = 22
const BODY_MAX_LINES = 4
const CODE_LINE_HEIGHT = 20
const CODE_VERTICAL_PADDING = 24
const CODE_MAX_LINES = 5
const DIVIDER_HEIGHT = 12
const CARD_MAX_HEIGHT = 340

export function estimateNoteCardHeight(note: NoteInspiration) {
  const preview = buildNotePreview({ content: note.content, title: note.title })
  let height = CARD_BASE_HEIGHT

  if (preview.title) {
    const titleLines = Math.min(
      Math.ceil(preview.title.length / TITLE_CHARS_PER_LINE),
      TITLE_MAX_LINES
    )
    height += titleLines * TITLE_LINE_HEIGHT
  }

  for (const block of preview.blocks) {
    if (block.kind === "divider") {
      height += DIVIDER_HEIGHT
      continue
    }

    const textLength = block.text?.length ?? 0
    const estimatedLines = Math.max(1, Math.ceil(textLength / BODY_CHARS_PER_LINE))

    if (block.kind === "code") {
      height +=
        Math.min(estimatedLines, CODE_MAX_LINES) * CODE_LINE_HEIGHT +
        CODE_VERTICAL_PADDING
      continue
    }

    height += Math.min(estimatedLines, BODY_MAX_LINES) * BODY_LINE_HEIGHT
  }

  return Math.min(height, CARD_MAX_HEIGHT)
}
