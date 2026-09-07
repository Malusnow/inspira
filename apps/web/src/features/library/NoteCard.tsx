import type { NoteInspiration } from "@inspira/contracts"
import { FileIcon } from "tdesign-icons-react"
import { Tag } from "tdesign-react"

import { formatTimestamp } from "./noteFormat"

export interface NoteCardProps {
  note: NoteInspiration
  onOpen: (note: NoteInspiration) => void
}

export function NoteCard({ note, onOpen }: NoteCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(note)}
      className="group flex min-h-[220px] cursor-pointer flex-col gap-2.5 rounded-lg border border-line bg-surface p-4 text-start transition
                 hover:border-brand-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 hover:shadow-card">
      <span className="flex items-center gap-1.5 text-xs text-ink-muted">
        <FileIcon className="size-4" />
        Note
      </span>
      <strong className="break-words text-lg leading-snug text-ink-strong">
        {note.title || "Untitled note"}
      </strong>
      <p className="line-clamp-5 break-words text-sm leading-relaxed text-ink">
        {note.content}
      </p>
      <span className="mt-auto text-xs text-ink-muted">
        {formatTimestamp(note.createdAt)}
      </span>
      {note.tags.length > 0 ? (
        <span className="flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <Tag key={tag} size="small" variant="light" className="text-ink-muted">
              {tag}
            </Tag>
          ))}
        </span>
      ) : null}
    </button>
  )
}
