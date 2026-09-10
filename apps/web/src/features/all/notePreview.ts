import type { NoteInspiration } from "@inspira/contracts"

export type NotePreviewKind =
  | "text"
  | "heading"
  | "checklist"
  | "quote"
  | "code"
  | "divider"
  | "spacer"

export interface NotePreviewBlock {
  kind: NotePreviewKind
  text?: string
  level?: 1 | 2 | 3
  checked?: boolean
}

export interface NotePreview {
  title?: string
  blocks: NotePreviewBlock[]
  dominantKind: Exclude<NotePreviewKind, "heading" | "divider" | "spacer">
}

const MAX_BLOCKS = 7
const MAX_TEXT_LENGTH = 240

interface BuildNotePreviewOptions {
  includeAllBlocks?: boolean
}

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~]/g, "")
    .trim()
}

function clampText(value: string, maxLength = MAX_TEXT_LENGTH) {
  const normalized = value.replace(/\s+/g, " ").trim()

  if (normalized.length <= maxLength) return normalized

  return `${normalized.slice(0, maxLength).trim()}...`
}

function isFence(line: string) {
  return line.trim().startsWith("```")
}

function parseMarkdownBlocks(content: string) {
  const blocks: NotePreviewBlock[] = []
  const lines = content.split(/\r?\n/)
  let paragraph: string[] = []
  let code: string[] = []
  let blankLineCount = 0
  let inCode = false

  function flushParagraph() {
    if (paragraph.length === 0) return

    const text = clampText(cleanInlineMarkdown(paragraph.join(" ")))
    if (text) {
      blocks.push({ kind: "text", text })
    }
    paragraph = []
  }

  function flushCode() {
    const text = code.join("\n").trim()
    if (text) {
      blocks.push({ kind: "code", text: text.slice(0, 320) })
    }
    code = []
  }

  function flushBlankLines() {
    if (blankLineCount === 0) return

    const spacerCount = Math.floor(blankLineCount / 2)

    for (let index = 0; index < spacerCount; index += 1) {
      blocks.push({ kind: "spacer" })
    }

    blankLineCount = 0
  }

  for (const line of lines) {
    if (isFence(line)) {
      flushBlankLines()
      if (inCode) {
        flushCode()
        inCode = false
      } else {
        flushParagraph()
        inCode = true
      }
      continue
    }

    if (inCode) {
      code.push(line)
      continue
    }

    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      blankLineCount += 1
      continue
    }

    flushBlankLines()

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: clampText(cleanInlineMarkdown(heading[2]), 96)
      })
      continue
    }

    const checklist = /^[-*]\s+\[( |x|X)\]\s+(.+)$/.exec(trimmed)
    if (checklist) {
      flushParagraph()
      blocks.push({
        kind: "checklist",
        checked: checklist[1].toLowerCase() === "x",
        text: clampText(cleanInlineMarkdown(checklist[2]), 120)
      })
      continue
    }

    if (trimmed.startsWith(">")) {
      flushParagraph()
      blocks.push({
        kind: "quote",
        text: clampText(cleanInlineMarkdown(trimmed.replace(/^>\s?/, "")), 180)
      })
      continue
    }

    if (/^---+$/.test(trimmed)) {
      flushParagraph()
      blocks.push({ kind: "divider" })
      continue
    }

    paragraph.push(trimmed)
  }

  if (inCode) flushCode()
  flushParagraph()
  flushBlankLines()

  return blocks.filter(
    (block) =>
      block.kind === "divider" || block.kind === "spacer" || block.text
  )
}

function firstTextBlock(blocks: NotePreviewBlock[]) {
  return blocks.find((block) => block.text && block.kind !== "divider")
}

function inferDominantKind(
  blocks: NotePreviewBlock[]
): NotePreview["dominantKind"] {
  if (blocks.some((block) => block.kind === "code")) return "code"
  if (blocks.some((block) => block.kind === "quote")) return "quote"
  if (blocks.some((block) => block.kind === "checklist")) return "checklist"

  return "text"
}

export function buildNotePreview(
  note: NoteInspiration,
  options: BuildNotePreviewOptions = {}
): NotePreview {
  const parsedBlocks = parseMarkdownBlocks(note.content)
  const firstHeading = parsedBlocks.find((block) => block.kind === "heading")
  const title = note.title?.trim() || firstHeading?.text
  const blocks = title
    ? parsedBlocks.filter((block) => block !== firstHeading)
    : parsedBlocks
  const renderableBlocks = blocks.filter((block, index, allBlocks) => {
    if (block.kind !== "spacer") return true

    return index > 0 && index < allBlocks.length - 1
  })
  const visibleBlocks = options.includeAllBlocks
    ? renderableBlocks
    : renderableBlocks.slice(0, MAX_BLOCKS)

  if (visibleBlocks.length === 0) {
    const fallbackText = firstTextBlock(parsedBlocks)?.text

    return {
      title: title || fallbackText || "Untitled note",
      blocks: [],
      dominantKind: inferDominantKind(parsedBlocks)
    }
  }

  return {
    title,
    blocks: visibleBlocks,
    dominantKind: inferDominantKind(visibleBlocks)
  }
}
