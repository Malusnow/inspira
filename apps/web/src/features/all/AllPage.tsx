import type { NoteInspiration } from "@inspira/contracts"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useOutletContext } from "react-router-dom"

import { api } from "../../../../../convex/_generated/api"
import type { AppShellOutletContext } from "../../app/AppShell"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import { WorkspacePickerPopover } from "../workspaces/WorkspacePickerPopover"
import { useNoteWorkspaceAssignment } from "../workspaces/useNoteWorkspaceAssignment"
import { AllErrorBoundary } from "./AllErrorBoundary"
import { AllTopBar, type AllColumnCount } from "./AllTopBar"
import { NoteDetailDialog } from "./NoteDetail"
import { NoteList } from "./NoteList"
import { useNoteDeletion } from "./useNoteDeletion"

/**
 * Signed-in All surface. UI follows the prototype's narrow
 * rail, top search field, view toggle, masonry cards, and floating detail layer
 * while data remains scoped to the authenticated owner's Notes.
 */
export function AllPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  // Queried here rather than inside `AllContent`: the selected Note is derived
  // from this list, so deleting it closes the detail layer on its own.
  const notes = useQuery(
    api.notes.listMine,
    isAuthenticated ? {} : "skip"
  ) as NoteInspiration[] | undefined
  const { openNoteOverlay, query, setQuery } =
    useOutletContext<AppShellOutletContext>()
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const {
    pendingNote,
    isDeleting,
    requestDelete,
    cancel: cancelDelete,
    confirm: confirmDelete
  } = useNoteDeletion()
  const {
    pending: pendingAssignment,
    workspaces,
    isAssigning,
    requestAssignment,
    closePicker,
    assign
  } = useNoteWorkspaceAssignment()
  // Derived instead of copied into state, so an edit always shows the fresh row
  // and a delete closes the layer without a manual `setSelectedNote` patch.
  const selectedNote = useMemo(
    () =>
      selectedNoteId
        ? (notes?.find((note) => note.id === selectedNoteId) ?? null)
        : null,
    [notes, selectedNoteId]
  )

  return (
    <AllErrorBoundary>
      <section className="mx-auto w-full max-w-[1800px]">
        <AllContent
          notes={notes}
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          query={query}
          onQueryChange={setQuery}
          onEditNote={openNoteOverlay}
          onOpenNote={(note) => setSelectedNoteId(note.id)}
          onRequestDeleteNote={requestDelete}
          onRequestAddToWorkspace={requestAssignment}
        />
      </section>
      <NoteDetailDialog
        note={selectedNote}
        onClose={() => setSelectedNoteId(null)}
      />

      <ConfirmDialog
        visible={pendingNote !== null}
        isLoading={isDeleting}
        title="删除这张卡片？"
        description="删除后不可恢复"
        confirmText="删除"
        cancelText="取消"
        intent="danger"
        onCancel={cancelDelete}
        onConfirm={() => void confirmDelete()}
      />

      {pendingAssignment ? (
        <WorkspacePickerPopover
          anchor={pendingAssignment.anchor}
          workspaces={workspaces}
          currentWorkspaceId={pendingAssignment.note.workspaceId}
          isAdding={isAssigning}
          onClose={closePicker}
          onSelect={(workspaceId) => void assign(workspaceId)}
        />
      ) : null}
    </AllErrorBoundary>
  )
}

function AllContent({
  notes,
  isAuthenticated,
  isLoading,
  query,
  onQueryChange,
  onEditNote,
  onOpenNote,
  onRequestDeleteNote,
  onRequestAddToWorkspace
}: {
  notes: NoteInspiration[] | undefined
  isAuthenticated: boolean
  isLoading: boolean
  query: string
  onQueryChange: (query: string) => void
  onEditNote: (note: NoteInspiration) => void
  onOpenNote: (note: NoteInspiration) => void
  onRequestDeleteNote: (note: NoteInspiration) => void
  onRequestAddToWorkspace: (
    note: NoteInspiration,
    anchor: { x: number; y: number }
  ) => void
}) {
  const seedStarterNotes = useMutation(api.notes.seedStarterNotes)
  const [columnCount, setColumnCount] = useState<AllColumnCount>(4)
  const didRequestStarterNotes = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || notes === undefined || notes.length > 0) return
    if (didRequestStarterNotes.current) return

    didRequestStarterNotes.current = true
    void seedStarterNotes().catch(() => {
      didRequestStarterNotes.current = false
    })
  }, [isAuthenticated, notes, seedStarterNotes])

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!notes || !normalizedQuery) return notes

    return notes.filter((note) => {
      const haystack = [
        note.title ?? "",
        note.content,
        note.notes ?? "",
        ...note.tags
      ].join(" ")

      return haystack.toLowerCase().includes(normalizedQuery)
    })
  }, [notes, query])

  const visibleNotes =
    isLoading || isAuthenticated ? filteredNotes : ([] as NoteInspiration[])

  return (
    <>
      <AllTopBar
        query={query}
        columnCount={columnCount}
        onQueryChange={onQueryChange}
        onColumnCountChange={setColumnCount}
      />
      <NoteList
        notes={visibleNotes}
        columnCount={columnCount}
        onEditNote={onEditNote}
        onOpenNote={onOpenNote}
        onRequestDeleteNote={onRequestDeleteNote}
        onRequestAddToWorkspace={onRequestAddToWorkspace}
      />
    </>
  )
}
