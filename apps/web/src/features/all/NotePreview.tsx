import type { NotePreview, NotePreviewBlock } from "./notePreview"

export interface NoteCardPreviewProps {
  preview: NotePreview
}

function PreviewBlock({ block }: { block: NotePreviewBlock }) {
  switch (block.kind) {
    case "heading":
      return (
        <strong className="block break-words text-[24px] font-semibold leading-snug text-ink-strong">
          {block.text}
        </strong>
      )
    case "checklist":
      return (
        <span className="flex min-w-0 items-start gap-2 text-[16px] leading-relaxed text-ink-strong ">
          <span
            aria-hidden="true"
            className={`mt-[5px] size-4 shrink-0 rounded-full border ${
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
        <span className="block w-fit max-w-full break-words bg-note-highlight px-2 py-1 text-[16px] font-medium leading-relaxed text-ink-strong">
          {block.text}
        </span>
      )
    case "code":
      return (
        <pre className="max-w-full rounded-md bg-note-code px-4 py-3 font-mono text-[16px] leading-relaxed text-ink-strong">
          <code className="line-clamp-5 whitespace-pre-wrap break-words">
            {block.text}
          </code>
        </pre>
      )
    case "divider":
      return <span className="block h-px w-full bg-line-strong" />
    case "spacer":
      return <span aria-hidden="true" className="block h-[1.45rem]" />
    case "text":
    default:
      return (
        <span className="block break-words text-[20px] leading-relaxed text-ink-strong">
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
