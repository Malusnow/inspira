import type { NoteInspiration } from "@inspira/contracts"
import { Drawer, Tag } from "tdesign-react"

import { formatTimestamp, getNoteTone } from "./noteFormat"

export interface NoteDetailDialogProps {
  /** Selected Note to show, or null/undefined to keep the layer closed. */
  note: NoteInspiration | null
  /** Closes the detail floating layer; focus returns to the triggering card. */
  onClose: () => void
}

export function NoteDetailDialog({ note, onClose }: NoteDetailDialogProps) {
  return (
    <Drawer
      visible={Boolean(note)}
      header={false}
      footer={false}
      size="min(1040px, 100vw)"
      closeBtn
      destroyOnClose
      onClose={onClose}>
      {note ? (
        <div className="grid min-h-[calc(100svh-48px)] gap-0 text-start lg:grid-cols-[minmax(0,1fr)_320px]">
          <article
            className={`${getNoteTone(note.id)} flex min-h-[420px] items-start justify-center overflow-auto px-6 py-20 sm:px-10 lg:px-14`}>
            <div className="w-full max-w-[680px]">
              <p className="mb-5 text-xs font-semibold uppercase tracking-normal text-ink-muted">
                Note
              </p>
              <h2 className="break-words text-[32px] font-semibold leading-tight text-ink-strong sm:text-[42px]">
                {note.title || "Untitled note"}
              </h2>
              <p className="mt-8 whitespace-pre-wrap break-words text-[16px] leading-8 text-ink-strong [overflow-wrap:anywhere]">
                {note.content}
              </p>
            </div>
          </article>

          <aside className="border-t border-line bg-surface px-6 py-8 lg:border-l lg:border-t-0">
            <h3 className="break-words text-2xl font-semibold leading-tight text-ink-strong">
              {note.title || "Untitled note"}
            </h3>
            <p className="mt-3 text-sm text-ink-muted">
              Saved {formatTimestamp(note.createdAt)}
            </p>

            <section className="mt-8">
              <h4 className="text-xs font-semibold uppercase tracking-normal text-ink-muted">
                Tags
              </h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {note.tags.length > 0 ? (
                  note.tags.map((tag) => (
                    <Tag key={tag} variant="light" className="max-w-full">
                      {tag}
                    </Tag>
                  ))
                ) : (
                  <span className="text-sm text-ink-muted">No tags</span>
                )}
              </div>
            </section>

            <section className="mt-8">
              <h4 className="text-xs font-semibold uppercase tracking-normal text-ink-muted">
                Notes
              </h4>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink [overflow-wrap:anywhere]">
                {note.content}
              </p>
            </section>

            <dl className="mt-8 grid gap-4 border-t border-line pt-6">
              <div>
                <dt className="text-xs font-semibold text-ink-muted">
                  Created
                </dt>
                <dd className="mt-1 text-sm text-ink-strong">
                  {formatTimestamp(note.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted">
                  Updated
                </dt>
                <dd className="mt-1 text-sm text-ink-strong">
                  {formatTimestamp(note.updatedAt)}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      ) : null}
    </Drawer>
  )
}
