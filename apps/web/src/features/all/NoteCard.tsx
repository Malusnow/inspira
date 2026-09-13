import type { InspirationItem } from "@inspira/contracts"
import { Edit2Icon, ImageIcon } from "tdesign-icons-react"

import { formatRelativeTimestamp } from "./noteFormat"
import { NoteCardPreview } from "./NotePreview"
import { buildNotePreview } from "./notePreview"
import { PageSnapshotFrame } from "./PageSnapshotFrame"

export interface NoteCardProps {
  note: InspirationItem
  isFresh?: boolean
  onEdit?: (note: InspirationItem) => void
  onOpen: (note: InspirationItem) => void
}

export function NoteCard({
  note,
  isFresh = false,
  onEdit,
  onOpen
}: NoteCardProps) {
  const preview = buildNotePreview({
    content: note.content,
    title: note.type === "quote" ? undefined : note.title,
    mediaAssets: note.mediaAssets
  })
  const isPage = note.type === "page"
  const isImage = note.type === "image"
  const isQuote = note.type === "quote"

  return (
    <article
      className={`note-card group relative flex w-full overflow-hidden rounded-xl bg-surface text-ink-strong shadow-none transition hover:-translate-y-0.5 hover:shadow-card focus-within:shadow-card ${
        isFresh ? "note-card-fresh" : ""
      } ${isPage ? "border border-brand/30" : ""} ${isImage ? "bg-canvas" : ""}`}>
      <button
        type="button"
        onClick={() => onOpen(note)}
        className={`flex w-full cursor-pointer flex-col border-0 bg-transparent text-start text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
          isPage || isImage ? "p-0" : "p-[18px]"
        }`}>
        {isImage ? (
          <div className="overflow-hidden bg-surface-hover">
            {note.primaryAssetUrl ? (
              <img
                src={note.primaryAssetUrl}
                alt={note.title || "Saved image"}
                className="block max-h-96 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="grid min-h-40 place-items-center text-ink-muted">
                <ImageIcon className="text-3xl" />
              </div>
            )}
          </div>
        ) : null}

        {isPage ? (
          <PageSnapshotFrame
            title={note.title || "Saved page snapshot preview"}
            url={note.pageSnapshot?.htmlUrl}
            className="aspect-[16/10] w-full rounded-none border-0"
          />
        ) : null}

        {!isPage && !isImage ? <NoteCardPreview preview={preview} /> : null}

        {!isPage && !isImage && !isQuote ? (
          <span className="mt-4 text-[11.5px] text-ink-muted">
            {formatRelativeTimestamp(note.createdAt)}
          </span>
        ) : null}
      </button>

      <div className="absolute right-3 top-3 flex items-center gap-2">
        {onEdit && note.type === "note" ? (
          <button
            type="button"
            title="Edit"
            aria-label="Edit note"
            onClick={() => onEdit(note)}
            className="grid size-8 translate-y-1 scale-95 place-items-center rounded-full border border-line bg-surface/90 text-[15px] text-ink-muted opacity-0 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:scale-105 focus-visible:translate-y-0 focus-visible:scale-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100">
            <Edit2Icon />
          </button>
        ) : null}
      </div>

      {isPage && note.sourceUrl ? (
        <a
          href={note.sourceUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="absolute bottom-3 right-3 translate-y-1 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-medium text-brand-ink-hover opacity-0 shadow-sm transition hover:bg-brand-soft focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          打开原网页
        </a>
      ) : null}
    </article>
  )
}
