import {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_NOTES_MAX_LENGTH,
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  type InspirationItem
} from "@inspira/contracts"
import { useMutation } from "convex/react"
import { useMemo, useRef, useState } from "react"
import { CloseIcon, DeleteIcon, FolderAddIcon } from "tdesign-icons-react"
import { Drawer, Tag } from "tdesign-react"

import { api } from "../../../../../convex/_generated/api"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { toInspirationId } from "../../lib/convexIds"
import { useNoteWorkspaceAssignment } from "../workspaces/useNoteWorkspaceAssignment"
import { WorkspacePickerPopover } from "../workspaces/WorkspacePickerPopover"
import { formatDetailTimestamp } from "./noteFormat"
import { NoteDetailBody } from "./NotePreview"
import { buildNotePreview } from "./notePreview"
import { PageSnapshotFrame } from "./PageSnapshotFrame"
import { useNoteDeletion } from "./useNoteDeletion"

export interface NoteDetailDialogProps {
  /** Selected Note to show, or null/undefined to keep the layer closed. */
  note: InspirationItem | null
  /** Closes the detail floating layer; focus returns to the triggering card. */
  onClose: () => void
}

function cleanTags(tags: string[]) {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))
  ).slice(0, NOTE_TAG_MAX_COUNT)
}

export function NoteDetailDialog({ note, onClose }: NoteDetailDialogProps) {
  useEscapeKey(Boolean(note), () => onClose())

  return (
    <Drawer
      visible={Boolean(note)}
      header={false}
      footer={false}
      size={note?.type === "page" ? "min(1500px, 100vw)" : "min(1040px, 100vw)"}
      className={`note-detail-drawer ${
        note?.type === "page" ? "note-detail-drawer--page" : ""
      }`}
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
        <NoteDetailContent key={note.id} note={note} onClose={onClose} />
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
  onClose
}: {
  note: InspirationItem
  onClose: () => void
}) {
  const updateNote = useMutation(api.notes.update)
  const updateCaptureDetails = useMutation(api.captures.updateDetails)
  const [title, setTitle] = useState(note.title ?? "")
  const [mindNotes, setMindNotes] = useState(note.notes ?? "")
  const [tags, setTags] = useState<string[]>(note.tags)
  const [tagDraft, setTagDraft] = useState("")
  const [isTagInputOpen, setIsTagInputOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const addToWorkspaceButtonRef = useRef<HTMLButtonElement>(null)
  // The anchor and the note it belongs to travel together, so the picker can
  // never end up in an "anchor without a note" state.
  const {
    pending: pendingAssignment,
    workspaces,
    isAssigning,
    requestAssignment,
    closePicker,
    assign
  } = useNoteWorkspaceAssignment()
  const {
    pendingNote,
    isDeleting,
    requestDelete,
    cancel: cancelDelete,
    confirm: confirmDelete
  } = useNoteDeletion({ onDeleted: onClose })
  const detailPreview = buildNotePreview(
    {
      content: note.content,
      title: note.type === "quote" ? undefined : note.title,
      mediaAssets: note.mediaAssets
    },
    { includeAllBlocks: true }
  )
  const isPlainNote = note.type === "note"

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
      // The reactive query is the source of truth for the selected Note, so
      // there is no local copy to patch back into the parent here.
      if (isPlainNote) {
        await updateNote({
          id: toInspirationId(note.id),
          title: nextTitle || undefined,
          content: note.content.slice(0, NOTE_CONTENT_MAX_LENGTH),
          notes: nextNotes || undefined,
          tags: nextTags,
          workspaceId: note.workspaceId
        })
      } else {
        await updateCaptureDetails({
          id: toInspirationId(note.id),
          note: nextNotes || undefined,
          tags: nextTags
        })
      }
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

  return (
    <div
      className={`grid h-full min-h-svh gap-0 text-start ${
        note.type === "page"
          ? "lg:grid-cols-[minmax(0,1fr)_340px]"
          : "lg:grid-cols-[minmax(0,1fr)_320px]"
      }`}>
      <article
        className={`flex min-h-[420px] items-start justify-center bg-canvas ${
          note.type === "page"
            ? "overflow-hidden px-3 py-16 sm:px-5 lg:px-8"
            : "overflow-y-auto px-6 py-20 sm:px-10 lg:px-14"
        }`}>
        <DetailPrimary note={note} preview={detailPreview} />
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
          readOnly={!isPlainNote}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => void handleSave()}
          className="min-h-20 resize-none rounded-md border-0 bg-transparent p-0 text-3xl font-light leading-tight text-ink-strong outline-none placeholder:text-ink-muted/60 read-only:cursor-default focus-visible:ring-0"
        />
        <p className="text-sm text-ink-muted">
          {formatDetailTimestamp(note.createdAt)}
        </p>

        {note.sourceUrl ? (
          <a
            href={note.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-fit rounded-full bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand-ink-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            打开原网页
          </a>
        ) : null}

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

        <div className="mt-12 flex items-center justify-end gap-3">
          <button
            ref={addToWorkspaceButtonRef}
            type="button"
            aria-label="移动到工作区"
            title="移动到工作区"
            disabled={isAssigning}
            onClick={() => {
              const bounds =
                addToWorkspaceButtonRef.current?.getBoundingClientRect()

              if (!bounds) return

              requestAssignment(note, { x: bounds.left, y: bounds.bottom + 8 })
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border-0 bg-surface-hover px-4 text-sm font-medium text-ink-muted transition duration-200 hover:-translate-y-0.5 hover:bg-brand-soft hover:text-brand-ink-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0">
            <FolderAddIcon className="size-4" />
            移动到工作区
          </button>
          <button
            type="button"
            aria-label="Delete card"
            title="Delete card"
            disabled={isDeleting}
            onClick={() => requestDelete(note)}
            className="grid size-10 place-items-center rounded-full border-0 bg-surface-hover text-lg text-ink-muted transition duration-200 hover:-translate-y-0.5 hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0">
            <DeleteIcon />
          </button>
        </div>

        <ConfirmDialog
          visible={pendingNote !== null}
          isLoading={isDeleting}
          title="删除这条灵感？"
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
      </aside>
    </div>
  )
}

function DetailPrimary({
  note,
  preview
}: {
  note: InspirationItem
  preview: ReturnType<typeof buildNotePreview>
}) {
  if (note.type === "page") {
    return (
      <PageSnapshotFrame
        title={note.title || "Saved page snapshot"}
        url={note.pageSnapshot?.htmlUrl}
        interactive
        className="h-[calc(100svh-8rem)] min-h-[620px] w-full max-w-[1180px] shadow-sm"
      />
    )
  }

  if (note.type === "image") {
    return note.primaryAssetUrl ? (
      <img
        src={note.primaryAssetUrl}
        alt={note.title || "Saved image"}
        className="max-h-[calc(100svh-10rem)] max-w-full rounded-lg object-contain"
      />
    ) : (
      <div className="grid min-h-80 w-full max-w-130 place-items-center rounded-lg border border-dashed border-line bg-surface px-6 text-center text-sm text-ink-muted">
        图片暂不可用
      </div>
    )
  }

  return (
    <div className="w-full max-w-130">
      <NoteDetailBody preview={preview} />
    </div>
  )
}
