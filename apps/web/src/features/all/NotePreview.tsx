import type { NotePreview, NotePreviewBlock } from "./notePreview"

export interface NoteCardPreviewProps {
  preview: NotePreview
}

type PreviewSize = "card" | "compact"

interface PreviewSizeStyles {
  heading: string
  body: string
  quote: string
  code: string
  codeInner: string
  checklistBox: string
  spacer: string
}

/**
 * Type scale per surface. `card` is the masonry card and the detail body, and
 * must stay in sync with the height constants in `noteMasonry.ts`. `compact`
 * shrinks the same parsed blocks down to the stacked mini card in a workspace
 * tile, so both surfaces share one renderer instead of duplicating markdown
 * handling.
 */
const PREVIEW_SIZE_STYLES: Record<PreviewSize, PreviewSizeStyles> = {
  card: {
    heading: "text-[24px] leading-snug",
    body: "text-[20px] leading-relaxed",
    quote: "text-[16px] leading-relaxed",
    code: "px-4 py-3 text-[16px] leading-relaxed",
    codeInner: "line-clamp-5",
    checklistBox: "mt-[5px] size-4",
    spacer: "h-[1.45rem]"
  },
  compact: {
    heading: "text-[15px] leading-snug",
    body: "text-[12.5px] leading-[1.4]",
    quote: "text-[12.5px] leading-[1.4]",
    code: "px-2 py-1.5 text-[11px] leading-4",
    codeInner: "line-clamp-4",
    checklistBox: "mt-[3px] size-3",
    spacer: "h-[0.7rem]"
  }
}

function PreviewBlock({
  block,
  size = "card"
}: {
  block: NotePreviewBlock
  size?: PreviewSize
}) {
  const styles = PREVIEW_SIZE_STYLES[size]

  switch (block.kind) {
    case "heading":
      return (
        <strong
          className={`block break-words font-semibold text-ink-strong ${styles.heading}`}>
          {block.text}
        </strong>
      )
    case "checklist":
      return (
        <span
          className={`flex min-w-0 items-start gap-2 text-ink-strong ${styles.body}`}>
          <span
            aria-hidden="true"
            className={`shrink-0 rounded-full border ${styles.checklistBox} ${
              block.checked
                ? "border-brand bg-brand"
                : "border-line-strong bg-transparent"
            }`}
          />
          <span
            className={`min-w-0 break-words ${
              block.checked ? "text-ink-muted line-through" : ""
            }`}>
            {block.text}
          </span>
        </span>
      )
    case "quote":
      return (
        <span
          className={`block w-fit max-w-full break-words bg-note-highlight px-2 py-1 font-medium text-ink-strong ${styles.quote}`}>
          {block.text}
        </span>
      )
    case "code":
      return (
        <pre
          className={`max-w-full rounded-md bg-note-code font-mono text-ink-strong ${styles.code}`}>
          <code className={`whitespace-pre-wrap break-words ${styles.codeInner}`}>
            {block.text}
          </code>
        </pre>
      )
    case "divider":
      return <span className="block h-px w-full bg-line-strong" />
    case "spacer":
      return <span aria-hidden="true" className={`block ${styles.spacer}`} />
    case "text":
    default:
      return (
        <span className={`block break-words text-ink-strong ${styles.body}`}>
          {block.text}
        </span>
      )
  }
}

export function NoteCardPreview({ preview }: NoteCardPreviewProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {preview.title ? (
        <strong className="line-clamp-2 break-words text-[19px] font-semibold leading-snug text-ink-strong">
          {preview.title}
        </strong>
      ) : null}

      {preview.blocks.length > 0 ? (
        <div className="mt-3 flex max-h-[220px] min-w-0 flex-col gap-2.5 overflow-hidden">
          {preview.blocks.map((block, index) => (
            <PreviewBlock key={`${block.kind}-${index}`} block={block} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function NoteDetailBody({ preview }: NoteCardPreviewProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {preview.title ? (
        <strong className="break-words text-[19px] font-semibold leading-snug text-ink-strong">
          {preview.title}
        </strong>
      ) : null}

      {preview.blocks.length > 0 ? (
        <div className="mt-5 flex min-w-0 flex-col gap-2.5">
          {preview.blocks.map((block, index) => (
            <PreviewBlock key={`${block.kind}-${index}`} block={block} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Compact presentation of the same parsed blocks, used by the stacked mini
 * cards in a workspace tile. It intentionally renders the block types at a
 * smaller scale rather than reusing the interactive masonry card, which is a
 * button and would nest inside the workspace tile's own button.
 */
export function NoteCompactPreview({ preview }: NoteCardPreviewProps) {
  return (
    <div className="flex size-full min-w-0 flex-col overflow-hidden px-3 py-2.5">
      {preview.title ? (
        <strong className="line-clamp-2 break-words text-[13px] font-semibold leading-snug text-ink-strong">
          {preview.title}
        </strong>
      ) : null}

      {preview.blocks.length > 0 ? (
        <div className="mt-1.5 flex min-w-0 flex-col gap-1.5">
          {preview.blocks.map((block, index) => (
            <PreviewBlock
              key={`${block.kind}-${index}`}
              block={block}
              size="compact"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
