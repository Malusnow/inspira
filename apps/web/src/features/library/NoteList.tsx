import type { NoteInspiration } from "@inspira/contracts"
import { Loading } from "tdesign-react"

import { NoteCard } from "./NoteCard"

export interface NoteListProps {
  /** undefined → still loading; an array → loaded Note rows for the owner. */
  notes: NoteInspiration[] | undefined
  /** Opens the detail floating layer for the selected Note card. */
  onOpenNote: (note: NoteInspiration) => void
}

export function NoteList({ notes, onOpenNote }: NoteListProps) {
  if (notes === undefined) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-line p-6">
        <Loading text="Loading notes" />
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line p-6 text-center">
        <p className="text-lg font-medium text-ink-strong">No notes yet</p>
        <p className="text-sm text-ink-muted">
          Create your first note and it will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onOpen={onOpenNote} />
      ))}
    </div>
  )
}
