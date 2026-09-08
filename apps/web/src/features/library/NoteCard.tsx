import type { NoteInspiration } from "@inspira/contracts"
import { Tag } from "tdesign-react"

import { formatRelativeTimestamp, getNoteTone } from "./noteFormat"

export interface NoteCardProps {
  note: NoteInspiration
  compact?: boolean
  onOpen: (note: NoteInspiration) => void
}

export function NoteCard({ note, compact = false, onOpen }: NoteCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(note)}
      className={`${getNoteTone(note.id)} group mb-5 inline-flex w-full cursor-pointer break-inside-avoid flex-col overflow-hidden rounded-xl border-0 p-[18px] text-start text-ink-strong shadow-none transition hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${compact ? "min-h-[190px]" : "min-h-[210px]"}`}>
      <strong className="break-words text-[13.5px] font-semibold leading-relaxed text-ink-strong">
        {note.title || "Untitled note"}
      </strong>
      <p
        className={`mt-2 break-words text-[13.5px] leading-relaxed text-ink-strong ${compact ? "line-clamp-5" : "line-clamp-8"}`}>
        {note.content}
      </p>
      <span className="mt-3 text-[11.5px] text-ink-muted">
        {formatRelativeTimestamp(note.createdAt)}
      </span>
      {note.tags.length > 0 ? (
        <span className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {note.tags.map((tag) => (
            <Tag
              key={tag}
              size="small"
              variant="light"
              className="max-w-full text-ink-muted">
              {tag}
            </Tag>
          ))}
        </span>
      ) : null}
    </button>
  )
}
