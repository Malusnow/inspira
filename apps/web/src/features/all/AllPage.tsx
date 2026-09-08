import type { NoteInspiration } from "@inspira/contracts"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useOutletContext } from "react-router-dom"

import { api } from "../../../../../convex/_generated/api"
import type { AppShellOutletContext } from "../../app/AppShell"
import { AllErrorBoundary } from "./AllErrorBoundary"
import { AllTopBar, type AllViewMode } from "./AllTopBar"
import { NoteDetailDialog } from "./NoteDetail"
import { NoteList } from "./NoteList"

/**
 * Signed-in All surface. UI follows the prototype's narrow
 * rail, top search field, view toggle, masonry cards, and floating detail layer
 * while data remains scoped to the authenticated owner's Notes.
 */
export function AllPage() {
  const [selectedNote, setSelectedNote] = useState<NoteInspiration | null>(null)
  const { openNoteOverlay } = useOutletContext<AppShellOutletContext>()

  return (
    <AllErrorBoundary>
      <section className="mx-auto w-full max-w-[1800px]">
        <AllContent
          onEditNote={openNoteOverlay}
          onOpenNote={setSelectedNote}
        />
      </section>
      <NoteDetailDialog
        note={selectedNote}
        onNoteChange={setSelectedNote}
        onDelete={() => setSelectedNote(null)}
        onClose={() => setSelectedNote(null)}
      />
    </AllErrorBoundary>
  )
}

function AllContent({
  onEditNote,
  onOpenNote
}: {
  onEditNote: (note: NoteInspiration) => void
  onOpenNote: (note: NoteInspiration) => void
}) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const seedStarterNotes = useMutation(api.notes.seedStarterNotes)
  const notes = useQuery(
    api.notes.listMine,
    isAuthenticated ? {} : "skip"
  ) as NoteInspiration[] | undefined
  const [query, setQuery] = useState("")
  const [viewMode, setViewMode] = useState<AllViewMode>("masonry")
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
        viewMode={viewMode}
        onQueryChange={setQuery}
        onViewModeChange={setViewMode}
      />
      <NoteList
        notes={visibleNotes}
        viewMode={viewMode}
        onEditNote={onEditNote}
        onOpenNote={onOpenNote}
      />
    </>
  )
}
