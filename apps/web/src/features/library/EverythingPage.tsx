import { UserButton } from "@clerk/react"
import type { NoteInspiration } from "@inspira/contracts"
import { useQuery } from "convex/react"
import { useState } from "react"

import { api } from "../../../../../convex/_generated/api"
import { CreateNoteForm } from "./CreateNoteForm"
import { EverythingErrorBoundary } from "./EverythingErrorBoundary"
import { NoteDetailDialog } from "./NoteDetailDialog"
import { NoteList } from "./NoteList"

interface PageHeaderProps {
  eyebrow: string
  description: string
}

function PageHeader({ eyebrow, description }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-ink-strong sm:text-[34px]">
          Your notes
        </h1>
        <p className="mt-2 text-sm text-ink-muted">{description}</p>
      </div>
    </header>
  )
}

/**
 * Signed-in Everything (Library) surface for the note-core slice: a narrow side
 * bar with only the Library entry (excluded modules stay out of S1), the
 * owner-scoped Everything list, a Note create form, and a detail floating layer
 * opened from a card. Load/render failures surface via the error boundary.
 */
export function EverythingPage() {
  const [selectedNote, setSelectedNote] = useState<NoteInspiration | null>(null)

  return (
    <EverythingErrorBoundary>
      <main className="grid min-h-svh grid-cols-1 bg-canvas text-ink lg:grid-cols-[168px_minmax(0,1fr)]">
        <aside className="hidden flex-col justify-between border-r border-line bg-surface/60 p-6 lg:sticky lg:top-0 lg:flex lg:h-svh">
          <div>
            <p className="text-lg font-semibold tracking-tight text-ink-strong">
              Inspira
            </p>
            <nav aria-label="Library" className="mt-8 block">
              <span className="inline-flex text-sm font-medium text-ink-strong">
                Library
              </span>
            </nav>
          </div>
          <UserButton />
        </aside>

        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
          <EverythingContent onOpenNote={setSelectedNote} />
        </section>
      </main>

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
  const notes = useQuery(api.notes.listMine) as NoteInspiration[] | undefined

  return (
    <>
      <PageHeader
        eyebrow="Everything"
        description="Private notes you’ve saved: newest first."
      />
      {/* mobile brand so the signed-in view stays contextual */}
      <p className="-mb-2 text-sm font-semibold text-ink-strong lg:hidden">
        Inspira
      </p>
      <CreateNoteForm />
      <NoteList notes={notes} onOpenNote={onOpenNote} />
    </>
  )
}
