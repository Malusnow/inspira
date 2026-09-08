import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"

import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote
} from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import {
  NOTE_CONTENT_MAX_LENGTH,
  type NoteInspiration
} from "@inspira/contracts"
import { useConvexAuth, useMutation } from "convex/react"
import { useEffect, useState, type KeyboardEvent } from "react"
import { CloseIcon } from "tdesign-icons-react"

import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"

export interface NoteComposerProps {
  controlsVisible: boolean
  note?: NoteInspiration
  onDismiss: () => void
  onFinish: () => void
}

const allowedSlashItems = new Set([
  "Heading 1",
  "Check List",
  "Image",
  "Divider",
  "Quote",
  "Code Block"
])

function matchSlashItems(
  items: ReturnType<typeof getDefaultReactSlashMenuItems>,
  query: string
) {
  const normalizedQuery = query.toLowerCase()

  return items.filter((item) => {
    if (!allowedSlashItems.has(item.title)) return false
    if (!normalizedQuery) return true

    return item.title.toLowerCase().includes(normalizedQuery)
  })
}

export function NoteComposer({
  controlsVisible,
  note,
  onDismiss,
  onFinish
}: NoteComposerProps) {
  const noteMutation = useMutation(api.notes.create)
  const updateNoteMutation = useMutation(api.notes.update)
  const { isAuthenticated, isLoading } = useConvexAuth()
  const editor = useCreateBlockNote()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!note?.content) return

    try {
      const blocks = editor.tryParseMarkdownToBlocks(note.content)
      editor.replaceBlocks(
        editor.document,
        blocks.length > 0 ? blocks : [{ type: "paragraph", content: note.content }]
      )
    } catch {
      editor.replaceBlocks(editor.document, [
        { type: "paragraph", content: note.content }
      ])
    }
  }, [editor, note?.content])

  async function handleSave() {
    if (isSaving) return
    if (isLoading) {
      setSaveError("登录状态还在同步，稍后再试一次。")
      return
    }
    if (!isAuthenticated) {
      setSaveError("需要登录后才能保存。")
      return
    }

    const content = editor.blocksToMarkdownLossy(editor.document).trim()
    if (!content) {
      setSaveError("先写一点内容再保存。")
      return
    }

    setIsSaving(true)
    setSaveError(null)

    const payload: {
      content: string
      tags: string[]
      title?: string
      workspaceId?: string
    } = {
      content: content.slice(0, NOTE_CONTENT_MAX_LENGTH),
      tags: note?.tags ?? []
    }

    if (note?.title) payload.title = note.title
    if (note?.workspaceId) payload.workspaceId = note.workspaceId

    onFinish()

    try {
      if (note) {
        await updateNoteMutation({
          id: note.id as Id<"inspirations">,
          ...payload
        })
      } else {
        await noteMutation(payload)
      }

      onFinish()
    } catch (error) {
      console.error("Failed to save note", error)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      void handleSave()
    }
  }

  return (
    <form
      className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-7 sm:px-10 lg:px-12"
      onKeyDownCapture={handleKeyDown}
      onSubmit={(event) => {
        event.preventDefault()
        void handleSave()
      }}>
      <button
        type="button"
        title="Close"
        aria-label="Close"
        onClick={onDismiss}
        className={`inspiration-control fixed right-6 top-6 z-20 grid size-8 place-items-center rounded-full border-0 bg-surface/70 text-lg text-ink-muted shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          controlsVisible ? "" : "inspiration-control--hidden-up"
        }`}>
        <CloseIcon />
      </button>

      <div className="flex flex-1 items-start pt-[10svh] sm:pt-[12svh]">
        <div className="inspiration-editor w-full">
          <BlockNoteView
            editor={editor}
            slashMenu={false}
            formattingToolbar={false}
            linkToolbar={false}
            filePanel={false}
            sideMenu={false}
            tableHandles={false}
            theme="light">
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={async (query) =>
                matchSlashItems(getDefaultReactSlashMenuItems(editor), query)
              }
            />
          </BlockNoteView>
        </div>
      </div>

      <footer className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex items-center justify-end gap-4 px-6 sm:px-10">
        {saveError ? (
          <p
            role="status"
            className={`inspiration-control max-w-[min(360px,52vw)] text-right text-xs font-medium text-ink-muted ${
              controlsVisible ? "" : "inspiration-control--hidden-down"
            }`}>
            {saveError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSaving || isLoading}
          className={`inspiration-control pointer-events-auto rounded-full border border-line bg-surface/88 px-7 py-3 text-xs font-semibold uppercase text-ink-muted shadow-[0_18px_42px_rgb(37_43_53_/_0.16)] backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-60 ${
            controlsVisible ? "" : "inspiration-control--hidden-down"
          }`}>
          Save (Ctrl+Enter)
        </button>
      </footer>
    </form>
  )
}
