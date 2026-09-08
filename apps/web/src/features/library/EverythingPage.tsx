import type { NoteInspiration } from "@inspira/contracts"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Drawer } from "tdesign-react"

import { api } from "../../../../../convex/_generated/api"
import { CreateNoteForm } from "./CreateNoteForm"
import { EverythingErrorBoundary } from "./EverythingErrorBoundary"
import { LibraryTopBar, type LibraryViewMode } from "./LibraryTopBar"
import { NoteDetailDialog } from "./NoteDetailDialog"
import { NoteList } from "./NoteList"
import { LibraryShell } from "./Sidebar"

/**
 * Signed-in Everything (Library) surface. UI follows the prototype's narrow
 * rail, top search field, view toggle, masonry cards, and floating detail layer
 * while data remains scoped to the authenticated owner's Notes.
 */
export function EverythingPage() {
  const [selectedNote, setSelectedNote] = useState<NoteInspiration | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <EverythingErrorBoundary>
      <LibraryShell onCreateNote={() => setIsCreateOpen(true)}>
        <section className="mx-auto w-full max-w-[1800px]">
          <EverythingContent onOpenNote={setSelectedNote} />
        </section>
      </LibraryShell>

      <Drawer
        visible={isCreateOpen}
        header="New note"
        footer={false}
        size="min(440px, 100vw)"
        onClose={() => setIsCreateOpen(false)}>
        <CreateNoteForm onCreated={() => setIsCreateOpen(false)} />
      </Drawer>
      <NoteDetailDialog
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
      />
    </EverythingErrorBoundary>
  )
}

function EverythingContent({
  onOpenNote
}: {
  onOpenNote: (note: NoteInspiration) => void
}) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const seedStarterNotes = useMutation(api.notes.seedStarterNotes)
  const notes = useQuery(
    api.notes.listMine,
    isAuthenticated ? {} : "skip"
  ) as NoteInspiration[] | undefined
  const [query, setQuery] = useState("")
  const [viewMode, setViewMode] = useState<LibraryViewMode>("masonry")
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
        ...note.tags
      ].join(" ")

      return haystack.toLowerCase().includes(normalizedQuery)
    })
  }, [notes, query])

  const visibleNotes =
    isLoading || isAuthenticated ? filteredNotes : ([] as NoteInspiration[])

  return (
    <>
      <LibraryTopBar
        query={query}
        viewMode={viewMode}
        onQueryChange={setQuery}
        onViewModeChange={setViewMode}
      />
      <NoteList
        notes={visibleNotes}
        viewMode={viewMode}
        onOpenNote={onOpenNote}
      />
    </>
  )
}
