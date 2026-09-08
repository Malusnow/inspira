import type { NoteInspiration } from "@inspira/contracts"
import { useEffect, useMemo, useRef, useState } from "react"
import { Loading } from "tdesign-react"

import type { AllColumnCount } from "./AllTopBar"
import { NoteCard } from "./NoteCard"
import { buildNotePreview } from "./notePreview"

type EffectiveColumnCount = 1 | 2 | 3 | 4 | 5

const columnClasses: Record<EffectiveColumnCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5"
}

function getEffectiveColumnCount(selectedColumnCount: AllColumnCount) {
  if (typeof window === "undefined") return 1

  const width = window.innerWidth

  if (width < 640) return 1
  if (width < 900) return 2
  if (width < 1120) return 3

  return selectedColumnCount
}

function useEffectiveColumnCount(selectedColumnCount: AllColumnCount) {
  const [effectiveColumnCount, setEffectiveColumnCount] =
    useState<EffectiveColumnCount>(() =>
      getEffectiveColumnCount(selectedColumnCount)
    )

  useEffect(() => {
    function updateColumnCount() {
      setEffectiveColumnCount(getEffectiveColumnCount(selectedColumnCount))
    }

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)

    return () => window.removeEventListener("resize", updateColumnCount)
  }, [selectedColumnCount])

  return effectiveColumnCount
}

function estimateNoteCardHeight(note: NoteInspiration) {
  const preview = buildNotePreview(note)
  let height = 64

  if (preview.title) {
    height += Math.min(Math.ceil(preview.title.length / 28), 2) * 24
  }

  for (const block of preview.blocks) {
    if (block.kind === "divider") {
      height += 12
      continue
    }

    const textLength = block.text?.length ?? 0
    const estimatedLines = Math.max(1, Math.ceil(textLength / 38))

    if (block.kind === "code") {
      height += Math.min(estimatedLines, 5) * 20 + 24
      continue
    }

    height += Math.min(estimatedLines, 4) * 22
  }

  return Math.min(height, 340)
}

function distributeNotesIntoColumns(
  notes: NoteInspiration[],
  columnCount: EffectiveColumnCount
) {
  const columns = Array.from({ length: columnCount }, () => ({
    height: 0,
    notes: [] as NoteInspiration[]
  }))

  for (const note of notes) {
    const shortestColumn = columns.reduce((shortest, column) =>
      column.height < shortest.height ? column : shortest
    )

    shortestColumn.notes.push(note)
    shortestColumn.height += estimateNoteCardHeight(note) + 20
  }

  return columns
}

export interface NoteListProps {
  /** undefined → still loading; an array → loaded Note rows for the owner. */
  notes: NoteInspiration[] | undefined
  columnCount: AllColumnCount
  onEditNote: (note: NoteInspiration) => void
  /** Opens the detail floating layer for the selected Note card. */
  onOpenNote: (note: NoteInspiration) => void
}

export function NoteList({
  notes,
  onEditNote,
  columnCount,
  onOpenNote
}: NoteListProps) {
  const previousNoteIds = useRef<Set<string> | undefined>(undefined)
  const [freshNoteIds, setFreshNoteIds] = useState<Set<string>>(() => new Set())
  const effectiveColumnCount = useEffectiveColumnCount(columnCount)
  const masonryColumns = useMemo(
    () =>
      notes ? distributeNotesIntoColumns(notes, effectiveColumnCount) : [],
    [effectiveColumnCount, notes]
  )

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
        <Loading text="Loading" />
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
      className={`grid items-start gap-5 px-5 pb-[60px] sm:px-8 lg:px-10 ${columnClasses[effectiveColumnCount]}`}>
      {masonryColumns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex min-w-0 flex-col gap-5">
          {column.notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isFresh={freshNoteIds.has(note.id)}
              onEdit={onEditNote}
              onOpen={onOpenNote}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
