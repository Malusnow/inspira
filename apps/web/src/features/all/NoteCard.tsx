import type { NoteInspiration } from "@inspira/contracts"
import { Edit2Icon } from "tdesign-icons-react"

import { formatRelativeTimestamp } from "./noteFormat"
import { NoteCardPreview } from "./NotePreview"
import { buildNotePreview } from "./notePreview"

export interface NoteCardProps {
  note: NoteInspiration
  isFresh?: boolean
  onEdit?: (note: NoteInspiration) => void
  onOpen: (note: NoteInspiration) => void
}

export function NoteCard({
  note,
  isFresh = false,
  onEdit,
  onOpen
}: NoteCardProps) {
  const preview = buildNotePreview(note)

  return (
    <article
      className={`note-card group relative flex w-full overflow-hidden rounded-xl bg-surface text-ink-strong shadow-none transition hover:-translate-y-0.5 hover:shadow-card focus-within:shadow-card ${
        isFresh ? "note-card-fresh" : ""
      }`}>
      <button
        type="button"
        onClick={() => onOpen(note)}
        className="flex w-full cursor-pointer flex-col border-0 bg-transparent p-[18px] text-start text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
        <NoteCardPreview preview={preview} />

        <span className="mt-4 text-[11.5px] text-ink-muted">
          {formatRelativeTimestamp(note.createdAt)}
        </span>
      </button>

      <div className="absolute right-3 top-3 flex items-center gap-2">
        {onEdit ? (
          <button
            type="button"
            title="Edit"
            aria-label="Edit note"
            onClick={() => onEdit(note)}
            className="grid size-8 translate-y-1 scale-95 place-items-center rounded-full border border-line bg-surface/90 text-[15px] text-ink-muted opacity-0 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:scale-105 focus-visible:translate-y-0 focus-visible:scale-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100">
            <Edit2Icon />
          </button>
        ) : null}
      </div>
    </article>
  )
}
