import { SignInButton, UserButton, useUser } from "@clerk/react"
import type { NoteInspiration } from "@inspira/contracts"
import {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH
} from "@inspira/contracts"
import { useMutation, useQuery } from "convex/react"
import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { AddIcon, FileIcon, LoginIcon } from "tdesign-icons-react"
import {
  Alert,
  Button,
  Dialog,
  Input,
  Loading,
  Tag,
  Textarea
} from "tdesign-react"

import { api } from "../../../convex/_generated/api"

import "./App.css"

function formatDate(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value)
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong."
}

function SignedOutScreen() {
  return (
    <main className="signed-out">
      <section className="auth-panel">
        <p className="eyebrow">Inspira</p>
        <h1>Private notes, ready when you are.</h1>
        <p>Sign in to create notes and open your Everything list.</p>
        <SignInButton mode="modal">
          <Button theme="primary" size="large" icon={<LoginIcon />}>
            Sign in
          </Button>
        </SignInButton>
      </section>
    </main>
  )
}

function CreateNoteForm() {
  const createNote = useMutation(api.notes.create)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const parsedTags = useMemo(() => parseTags(tags), [tags])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!content.trim()) {
      setError("Note content is required.")
      return
    }

    if (parsedTags.length > NOTE_TAG_MAX_COUNT) {
      setError(`Use ${NOTE_TAG_MAX_COUNT} tags or fewer.`)
      return
    }

    if (parsedTags.some((tag) => tag.length > NOTE_TAG_MAX_LENGTH)) {
      setError(`Tags must be ${NOTE_TAG_MAX_LENGTH} characters or fewer.`)
      return
    }

    setIsSaving(true)

    try {
      await createNote({
        title: title || undefined,
        content,
        tags: parsedTags
      })
      setTitle("")
      setContent("")
      setTags("")
      setSuccess("Note saved.")
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        <Input
          label="Title"
          placeholder="Optional"
          value={title}
          maxlength={NOTE_TITLE_MAX_LENGTH}
          onChange={(value) => setTitle(String(value))}
        />
        <Input
          label="Tags"
          placeholder="comma, separated"
          value={tags}
          onChange={(value) => setTags(String(value))}
        />
      </div>
      <Textarea
        placeholder="Write a note"
        value={content}
        maxlength={NOTE_CONTENT_MAX_LENGTH}
        autosize={{ minRows: 5, maxRows: 10 }}
        onChange={(value) => setContent(String(value))}
      />
      {error ? <Alert theme="error" message={error} /> : null}
      {success ? <Alert theme="success" message={success} /> : null}
      <div className="form-actions">
        <Button
          theme="primary"
          type="submit"
          loading={isSaving}
          icon={<AddIcon />}>
          Create note
        </Button>
      </div>
    </form>
  )
}

function NoteCard({
  note,
  onOpen
}: {
  note: NoteInspiration
  onOpen: (note: NoteInspiration) => void
}) {
  return (
    <button type="button" className="note-card" onClick={() => onOpen(note)}>
      <span className="card-kicker">
        <FileIcon />
        Note
      </span>
      <strong>{note.title || "Untitled note"}</strong>
      <span className="card-content">{note.content}</span>
      <span className="card-meta">{formatDate(note.createdAt)}</span>
      {note.tags.length > 0 ? (
        <span className="tag-row">
          {note.tags.map((tag) => (
            <Tag key={tag} size="small" variant="light">
              {tag}
            </Tag>
          ))}
        </span>
      ) : null}
    </button>
  )
}

function EverythingList({
  notes,
  onOpen
}: {
  notes: NoteInspiration[] | undefined
  onOpen: (note: NoteInspiration) => void
}) {
  if (notes === undefined) {
    return (
      <div className="state-panel">
        <Loading text="Loading notes" />
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="state-panel">
        <h2>No notes yet</h2>
        <p>Create your first note and it will appear here.</p>
      </div>
    )
  }

  return (
    <div className="card-grid">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onOpen={onOpen} />
      ))}
    </div>
  )
}

function NoteDetail({
  note,
  onClose
}: {
  note: NoteInspiration | null
  onClose: () => void
}) {
  return (
    <Dialog
      visible={Boolean(note)}
      header={note?.title || "Untitled note"}
      footer={false}
      width={720}
      onClose={onClose}>
      {note ? (
        <article className="detail-body">
          <p>{note.content}</p>
          <dl>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(note.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(note.updatedAt)}</dd>
            </div>
          </dl>
          <div className="detail-tags">
            {note.tags.length > 0 ? (
              note.tags.map((tag) => (
                <Tag key={tag} variant="light">
                  {tag}
                </Tag>
              ))
            ) : (
              <span>No tags</span>
            )}
          </div>
        </article>
      ) : null}
    </Dialog>
  )
}

function LibraryApp() {
  const notes = useQuery(api.notes.listMine) as NoteInspiration[] | undefined
  const [selectedNote, setSelectedNote] = useState<NoteInspiration | null>(null)

  return (
    <main className="library-shell">
      <aside className="sidebar">
        <div>
          <p className="brand">Inspira</p>
          <nav aria-label="Library">
            <span className="nav-item active">Library</span>
          </nav>
        </div>
        <UserButton />
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Everything</p>
            <h1>Your notes</h1>
          </div>
        </header>

        <CreateNoteForm />
        <EverythingList notes={notes} onOpen={setSelectedNote} />
      </section>

      <NoteDetail note={selectedNote} onClose={() => setSelectedNote(null)} />
    </main>
  )
}

function App() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return (
      <main className="signed-out">
        <section className="auth-panel">
          <Loading text="Loading session" />
        </section>
      </main>
    )
  }

  return <>{isSignedIn ? <LibraryApp /> : <SignedOutScreen />}</>
}

export default App
