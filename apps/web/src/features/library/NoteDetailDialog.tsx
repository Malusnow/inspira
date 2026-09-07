import type { NoteInspiration } from "@inspira/contracts"
import { Dialog, Tag } from "tdesign-react"

import { formatTimestamp } from "./noteFormat"

export interface NoteDetailDialogProps {
  /** Selected Note to show, or null/undefined to keep the layer closed. */
  note: NoteInspiration | null
  /** Closes the detail floating layer; focus returns to the triggering card. */
  onClose: () => void
}

export function NoteDetailDialog({ note, onClose }: NoteDetailDialogProps) {
  return (
    <Dialog
      visible={Boolean(note)}
      header={note?.title || "Untitled note"}
      footer={false}
      width={720}
      onClose={onClose}>
      {note ? (
        <div className="flex flex-col gap-5 text-start">
          <p className="whitespace-pre-wrap break-words text-ink-strong [overflow-wrap:anywhere] leading-relaxed">
            {note.content}
          </p>
          <dl className="m-0 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs font-semibold text-ink-muted">Created</dt>
              <dd className="mt-0.5 text-ink-strong">
                {formatTimestamp(note.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-ink-muted">Updated</dt>
              <dd className="mt-0.5 text-ink-strong">
                {formatTimestamp(note.updatedAt)}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {note.tags.length > 0 ? (
              note.tags.map((tag) => (
                <Tag key={tag} variant="light">
                  {tag}
                </Tag>
              ))
            ) : (
              <span className="text-ink-muted">No tags</span>
            )}
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}
