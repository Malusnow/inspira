import {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_NOTES_MAX_LENGTH,
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  type NoteInspiration
} from "@inspira/contracts"
import { useMutation } from "convex/react"
import { useMemo, useState } from "react"
import { Drawer, MessagePlugin, Tag } from "tdesign-react"
import { CloseIcon, DeleteIcon } from "tdesign-icons-react"

import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { formatDetailTimestamp, getNoteTone } from "./noteFormat"
import { NoteCardPreview } from "./NotePreview"
import { buildNotePreview } from "./notePreview"

export interface NoteDetailDialogProps {
  /** Selected Note to show, or null/undefined to keep the layer closed. */
  note: NoteInspiration | null
  /** Keeps the open detail in sync after inline edits. */
  onNoteChange: (note: NoteInspiration) => void
  /** Closes the detail after the selected Note is deleted. */
  onDelete: () => void
  /** Closes the detail floating layer; focus returns to the triggering card. */
  onClose: () => void
}

function cleanTags(tags: string[]) {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))
  ).slice(0, NOTE_TAG_MAX_COUNT)
}

export function NoteDetailDialog({
  note,
  onNoteChange,
  onDelete,
  onClose
}: NoteDetailDialogProps) {
  useEscapeKey(Boolean(note), () => onClose())

  return (
    <Drawer
      visible={Boolean(note)}
      header={false}
      footer={false}
      size="min(1040px, 100vw)"
      className="note-detail-drawer"
      closeBtn={
        <button
          type="button"
          aria-label="Close detail"
          className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-2xl text-ink-muted transition hover:bg-ink/10 hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          onClick={onClose}>
          <CloseIcon className="size-5" />
        </button>
      }
      closeOnEscKeydown
      destroyOnClose
      onClose={onClose}>
      {note ? (
        <NoteDetailContent
          key={note.id}
          note={note}
          onNoteChange={onNoteChange}
          onDelete={onDelete}
        />
      ) : null}
    </Drawer>
  )
}

interface DetailTagsProps {
  canAddTag: boolean
  isTagInputOpen: boolean
  tagDraft: string
  tags: string[]
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
  onTagDraftChange: (value: string) => void
  onToggleTagInput: () => void
}

function DetailTags({
  canAddTag,
  isTagInputOpen,
  tagDraft,
  tags,
  onAddTag,
  onRemoveTag,
  onTagDraftChange,
  onToggleTagInput
}: DetailTagsProps) {
  return (
    <section className="mt-8">
      <h4 className="text-xs font-semibold uppercase tracking-normal text-ink-muted">
        TAGS
      </h4>

      {isTagInputOpen ? (
        <div className="mt-3 flex overflow-hidden rounded-md bg-canvas shadow-[0_16px_38px_rgb(37_43_53/0.12)]">
          <input
            value={tagDraft}
            maxLength={NOTE_TAG_MAX_LENGTH}
            aria-label="Add tag"
            autoFocus
            onChange={(event) => onTagDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onAddTag()
              }
            }}
            className="min-h-12 min-w-0 flex-1 border-0 bg-surface px-4 text-sm text-ink-strong outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
          />
          <button
            type="button"
            disabled={!canAddTag}
            onClick={onAddTag}
            aria-label="Add tag"
            className="grid min-h-12 w-14 place-items-center border-0 bg-brand text-3xl font-light leading-none text-white transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand disabled:cursor-default disabled:bg-line disabled:text-ink-muted">
            +
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleTagInput}
          className="min-h-10 rounded-full border-0 bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          + Add tag
        </button>
        {tags.map((tag) => (
          <div
            key={tag}
            className="flex min-h-10 items-center rounded-full border-0 bg-surface-hover px-4 text-sm text-ink-muted">
            <Tag
              closable
              variant="light"
              className="max-w-full"
              onClose={() => onRemoveTag(tag)}>
              {tag}
            </Tag>
          </div>
        ))}
      </div>
    </section>
  )
}

function NoteDetailContent({
  note,
  onNoteChange,
  onDelete
}: {
  note: NoteInspiration
  onNoteChange: (note: NoteInspiration) => void
  onDelete: () => void
}) {
  const updateNote = useMutation(api.notes.update)
  const removeNote = useMutation(api.notes.remove)
  const [title, setTitle] = useState(note.title ?? "")
  const [mindNotes, setMindNotes] = useState(note.notes ?? "")
  const [tags, setTags] = useState<string[]>(note.tags)
  const [tagDraft, setTagDraft] = useState("")
  const [isTagInputOpen, setIsTagInputOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const preview = buildNotePreview(note)

  const canAddTag = useMemo(() => {
    const nextTag = tagDraft.trim()

    return (
      nextTag.length > 0 &&
      nextTag.length <= NOTE_TAG_MAX_LENGTH &&
      tags.length < NOTE_TAG_MAX_COUNT &&
      !tags.includes(nextTag)
    )
  }, [tagDraft, tags])

  async function handleSave(nextValues?: {
    title?: string
    notes?: string
    tags?: string[]
  }) {
    if (!note || isSaving) return

    const nextTitle = (nextValues?.title ?? title).trim()
    const nextNotes = (nextValues?.notes ?? mindNotes).trim()
    const nextTags = cleanTags(nextValues?.tags ?? tags)

    if (
      nextTitle === (note.title ?? "") &&
      nextNotes === (note.notes ?? "") &&
      nextTags.join("\n") === note.tags.join("\n")
    ) {
      return
    }

    setIsSaving(true)

    try {
      await updateNote({
        id: note.id as Id<"inspirations">,
        title: nextTitle || undefined,
        content: note.content.slice(0, NOTE_CONTENT_MAX_LENGTH),
        notes: nextNotes || undefined,
        tags: nextTags,
        workspaceId: note.workspaceId
      })

      onNoteChange({
        ...note,
        title: nextTitle || undefined,
        notes: nextNotes || undefined,
        tags: nextTags
      })
    } catch (error) {
      console.error("Failed to update note detail", error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleAddTag() {
    if (!canAddTag) return

    const nextTags = cleanTags([...tags, tagDraft])

    setTags(nextTags)
    setTagDraft("")
    void handleSave({ tags: nextTags })
  }

  function handleRemoveTag(tag: string) {
    const nextTags = tags.filter((currentTag) => currentTag !== tag)

    setTags(nextTags)
    void handleSave({ tags: nextTags })
  }

  async function handleDelete() {
    if (isDeleting) return

    setIsDeleting(true)

    try {
      await removeNote({ id: note.id as Id<"inspirations"> })
      setIsDeleteConfirmOpen(false)
      onDelete()
      void MessagePlugin.success({
        content: "该灵感已删除",
        placement: "bottom-right"
      })
    } catch (error) {
      console.error("Failed to delete note", error)
      void MessagePlugin.error({
        content: "删除失败，请稍后再试",
        placement: "bottom-right"
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid h-full min-h-svh gap-0 text-start lg:grid-cols-[minmax(0,1fr)_320px]">
      <article
        className={`${getNoteTone(note.id)} flex min-h-[420px] items-center justify-center overflow-auto px-6 py-20 sm:px-10 lg:px-14`}>
        <div className="w-full max-w-130">
          <NoteCardPreview preview={preview} />
        </div>
      </article>

      <aside className="flex min-h-105 flex-col border-t border-line bg-surface px-6 py-8 lg:border-l lg:border-t-0">
        <label className="sr-only" htmlFor="note-detail-title">
          Title
        </label>
        <textarea
          id="note-detail-title"
          value={title}
          maxLength={NOTE_TITLE_MAX_LENGTH}
          rows={2}
          placeholder="Title"
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => void handleSave()}
          className="min-h-20 resize-none rounded-md border-0 bg-transparent p-0 text-3xl font-light leading-tight text-ink-strong outline-none placeholder:text-ink-muted/60 focus-visible:ring-0"
        />
        <p className="text-sm text-ink-muted">
          {formatDetailTimestamp(note.createdAt)}
        </p>

        <DetailTags
          canAddTag={canAddTag}
          isTagInputOpen={isTagInputOpen}
          tagDraft={tagDraft}
          tags={tags}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onTagDraftChange={setTagDraft}
          onToggleTagInput={() => setIsTagInputOpen((isOpen) => !isOpen)}
        />

        <section className="mt-8">
          <label
            htmlFor="note-detail-content"
            className="text-xs font-semibold uppercase tracking-normal text-ink-muted">
            NOTES
          </label>
          <textarea
            id="note-detail-content"
            value={mindNotes}
            maxLength={NOTE_NOTES_MAX_LENGTH}
            placeholder="Type here to add a note..."
            onChange={(event) => setMindNotes(event.target.value)}
            onBlur={() => void handleSave()}
            className="mt-3 min-h-32 w-full resize-y rounded-md border border-line bg-canvas px-4 py-3 text-sm leading-6 text-ink-strong outline-none placeholder:text-ink-muted"
          />
        </section>

        <div className="mt-12 flex justify-end">
          <button
            type="button"
            aria-label="Delete card"
            title="Delete card"
            disabled={isDeleting}
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="grid size-10 place-items-center rounded-full border-0 bg-surface-hover text-lg text-ink-muted transition duration-200 hover:-translate-y-0.5 hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0">
            <DeleteIcon />
          </button>
        </div>

        <ConfirmDialog
          visible={isDeleteConfirmOpen}
          isLoading={isDeleting}
          onCancel={() => {
            if (!isDeleting) setIsDeleteConfirmOpen(false)
          }}
          onConfirm={() => void handleDelete()}
        />
      </aside>
    </div>
  )
}
