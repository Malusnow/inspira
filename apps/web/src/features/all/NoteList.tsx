import type { NoteInspiration } from "@inspira/contracts"
import { useEffect, useRef, useState } from "react"

import type { AllViewMode } from "./AllTopBar"
import { NoteCard } from "./NoteCard"
import { Loading } from "tdesign-react"

export interface NoteListProps {
  /** undefined → still loading; an array → loaded Note rows for the owner. */
  notes: NoteInspiration[] | undefined
  viewMode: AllViewMode
  onEditNote: (note: NoteInspiration) => void
  /** Opens the detail floating layer for the selected Note card. */
  onOpenNote: (note: NoteInspiration) => void
}

export function NoteList({
  notes,
  onEditNote,
  viewMode,
  onOpenNote
}: NoteListProps) {
  const previousNoteIds = useRef<Set<string> | undefined>(undefined)
  const [freshNoteIds, setFreshNoteIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!notes) return

    const nextIds = new Set(notes.map((note) => note.id))
    const previousIds = previousNoteIds.current
    previousNoteIds.current = nextIds

    if (!previousIds) return

    const newIds = notes
      .map((note) => note.id)
      .filter((noteId) => !previousIds.has(noteId))

    if (newIds.length === 0) return

    setFreshNoteIds((currentIds) => {
      const nextFreshIds = new Set(currentIds)
      newIds.forEach((noteId) => nextFreshIds.add(noteId))
      return nextFreshIds
    })

    const timeoutId = window.setTimeout(() => {
      setFreshNoteIds((currentIds) => {
        const nextFreshIds = new Set(currentIds)
        newIds.forEach((noteId) => nextFreshIds.delete(noteId))
        return nextFreshIds
      })
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [notes])

  if (notes === undefined) {
    return (
      <div className="mx-5 flex min-h-[320px] items-center justify-center p-6 text-center sm:mx-8 lg:mx-10">
        <Loading text="加载中" />
      </div>
    );
  }
  if (notes.length === 0) {
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
          isFresh={freshNoteIds.has(note.id)}
          onEdit={onEditNote}
          onOpen={onOpenNote}
        />
      ))}
    </div>
  )
}
