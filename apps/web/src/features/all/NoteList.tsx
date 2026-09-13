import type { InspirationItem } from "@inspira/contracts"
import { useEffect, useRef, useState } from "react"
import { DeleteIcon, FolderAddIcon } from "tdesign-icons-react"

import { ContextMenu } from "../../components/ContextMenu"
import { useResponsiveColumnCount } from "../../hooks/useResponsiveColumnCount"
import type { AllColumnCount } from "./AllTopBar"
import { NoteCard } from "./NoteCard"
import { NoteMasonrySection } from "./NoteMasonrySection"

/** How long a freshly inserted card keeps its entry animation. */
const FRESH_NOTE_DURATION_MS = 900

export interface NoteListProps {
  /** undefined → still loading; an array → loaded Note rows for the owner. */
  notes: InspirationItem[] | undefined
  columnCount: AllColumnCount
  onEditNote: (note: InspirationItem) => void
  /** Opens the detail floating layer for the selected Note card. */
  onOpenNote: (note: InspirationItem) => void
  /** Right-click → delete the card (confirmation is handled by the caller). */
  onRequestDeleteNote: (note: InspirationItem) => void
  /** Right-click → pick a workspace for the card, anchored at the menu. */
  onRequestAddToWorkspace: (
    note: InspirationItem,
    anchor: { x: number; y: number }
  ) => void
}

export function NoteList({
  notes,
  onEditNote,
  columnCount,
  onOpenNote,
  onRequestDeleteNote,
  onRequestAddToWorkspace
}: NoteListProps) {
  const previousNoteIds = useRef<Set<string> | undefined>(undefined)
  const menuPositionRef = useRef({ x: 0, y: 0 })
  const [freshNoteIds, setFreshNoteIds] = useState<Set<string>>(() => new Set())
  const effectiveColumnCount = useResponsiveColumnCount(columnCount)

  useEffect(() => {
    if (!notes) return

    const previousIds = previousNoteIds.current
    const nextIds = new Set(notes.map((note) => note.id))

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

    function dropFreshIds() {
      setFreshNoteIds((currentIds) => {
        if (!newIds.some((noteId) => currentIds.has(noteId))) return currentIds

        const nextFreshIds = new Set(currentIds)
        newIds.forEach((noteId) => nextFreshIds.delete(noteId))
        return nextFreshIds
      })
    }

    const timeoutId = window.setTimeout(dropFreshIds, FRESH_NOTE_DURATION_MS)

    // Any note edit re-pushes the query and re-runs this effect. Clearing the
    // timer alone would strand these ids in the fresh set forever, so drop them
    // here too instead of relying on the timer to fire.
    return () => {
      window.clearTimeout(timeoutId)
      dropFreshIds()
    }
  }, [notes])

  return (
    <NoteMasonrySection
      notes={notes}
      columnCount={effectiveColumnCount}
      className="px-5 pb-[60px] sm:px-8 lg:px-10"
      emptyState={
        <div className="mx-5 flex min-h-[320px] items-center justify-center p-6 text-center sm:mx-8 lg:mx-10">
          <p className="select-none text-sm font-normal text-ink-muted/60">
            还没有记录的灵感，快添加你的第一条灵感吧
          </p>
        </div>
      }
      renderCard={(note) => (
        <ContextMenu
          label="卡片操作"
          onOpen={(position) => {
            menuPositionRef.current = position
          }}
          items={[
            {
              id: "move-to-workspace",
              label: "移动到工作区",
              icon: <FolderAddIcon className="size-4" />,
              onSelect: () =>
                onRequestAddToWorkspace(note, menuPositionRef.current)
            },
            {
              id: "delete",
              label: "删除卡片",
              intent: "danger",
              icon: <DeleteIcon className="size-4" />,
              onSelect: () => onRequestDeleteNote(note)
            }
          ]}>
          <NoteCard
            note={note}
            isFresh={freshNoteIds.has(note.id)}
            onEdit={onEditNote}
            onOpen={onOpenNote}
          />
        </ContextMenu>
      )}
    />
  )
}
