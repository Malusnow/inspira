import type { NoteInspiration } from "@inspira/contracts"

import type { LibraryViewMode } from "./LibraryTopBar"
import { NoteCard } from "./NoteCard"

export interface NoteListProps {
  /** undefined → still loading; an array → loaded Note rows for the owner. */
  notes: NoteInspiration[] | undefined
  viewMode: LibraryViewMode
  /** Opens the detail floating layer for the selected Note card. */
  onOpenNote: (note: NoteInspiration) => void
}

export function NoteList({
  notes,
  viewMode,
  onOpenNote
}: NoteListProps) {
  if (!notes || notes.length === 0) {
    return (
      <div className="mx-5 flex min-h-[320px] items-center justify-center p-6 text-center sm:mx-8 lg:mx-10">
        <p className="select-none text-sm font-normal text-ink-muted/60">
          还没有记录的灵感，快添加你的第一条灵感吧
        </p>
      </div>
    )
  }

  return (
    <div
      className={
        viewMode === "compact"
          ? "grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 px-5 pb-[60px] sm:px-8 lg:px-10"
          : "px-5 pb-[60px] [column-gap:20px] [column-count:1] sm:px-8 sm:[column-count:2] lg:px-10 xl:[column-count:3] 2xl:[column-count:4]"
      }>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          compact={viewMode === "compact"}
          onOpen={onOpenNote}
        />
      ))}
    </div>
  )
}
