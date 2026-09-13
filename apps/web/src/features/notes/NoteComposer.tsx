import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"

import type { Block, PartialBlock } from "@blocknote/core"
import { BlockNoteView } from "@blocknote/mantine"
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote
} from "@blocknote/react"
import {
  createNoteMediaReference,
  isMediaImageMimeType,
  MEDIA_IMAGE_MAX_BYTES,
  NOTE_CONTENT_MAX_LENGTH,
  type InspirationItem
} from "@inspira/contracts"
import { useConvex, useConvexAuth, useMutation } from "convex/react"
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { CloseIcon } from "tdesign-icons-react"

import { api } from "../../../../../convex/_generated/api"
import {
  toInspirationId,
  toMediaAssetId,
  toStorageId
} from "../../lib/convexIds"

type Editor = ReturnType<typeof useCreateBlockNote>

export interface NoteComposerProps {
  controlsVisible: boolean
  surfaceState: "entering" | "open" | "leaving"
  note?: InspirationItem
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

    const aliases =
      item.title === "Image" ? " addimage add image picture photo 图片" : ""

    return `${item.title}${aliases}`.toLowerCase().includes(normalizedQuery)
  })
}

function isEmptyParagraphBlock(block: Block | PartialBlock) {
  return (
    block.type === "paragraph" &&
    Array.isArray(block.content) &&
    block.content.length === 0
  )
}

function serializeDocumentToMarkdown(editor: Editor) {
  return (editor.document as Block[])
    .map((block: Block) =>
      isEmptyParagraphBlock(block)
        ? ""
        : editor.blocksToMarkdownLossy([block]).replace(/\n+$/g, "")
    )
    .join("\n\n")
}

function replaceMarkdownImageUrls(
  markdown: string,
  getReplacement: (url: string, alt: string) => string | undefined
) {
  return markdown.replace(/!\[([^\]]*)]\(([^)]+)\)/g, (match, alt, url) => {
    return getReplacement(url, alt) ?? match
  })
}

function parseMarkdownPreservingBlankParagraphs(
  editor: Editor,
  markdown: string
) {
  const blocks: PartialBlock[] = []
  const lines = markdown.split(/\r?\n/)
  let pendingLines: string[] = []
  let blankLineCount = 0
  let inCodeFence = false

  function flushPendingLines() {
    if (pendingLines.length === 0) return

    const parsedBlocks = editor.tryParseMarkdownToBlocks(
      pendingLines.join("\n")
    ) as Block[]

    blocks.push(
      ...(parsedBlocks.length > 0
        ? parsedBlocks
        : [{ type: "paragraph" as const, content: pendingLines.join("\n") }])
    )
    pendingLines = []
  }

  function flushBlankLines() {
    if (blankLineCount === 0) return

    const spacerCount = Math.floor(blankLineCount / 2)

    for (let index = 0; index < spacerCount; index += 1) {
      blocks.push({ type: "paragraph", content: "" })
    }

    blankLineCount = 0
  }

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushBlankLines()
      pendingLines.push(line)
      inCodeFence = !inCodeFence
      continue
    }

    if (!inCodeFence && line.trim() === "") {
      flushPendingLines()
      blankLineCount += 1
      continue
    }

    flushBlankLines()
    pendingLines.push(line)
  }

  flushPendingLines()
  flushBlankLines()

  return blocks
}

export function NoteComposer({
  controlsVisible,
  surfaceState,
  note,
  onDismiss,
  onFinish
}: NoteComposerProps) {
  const formId = useId()
  const noteMutation = useMutation(api.notes.create)
  const updateNoteMutation = useMutation(api.notes.update)
  const requestMediaUpload = useMutation(api.media.requestUpload)
  const finalizeMediaUpload = useMutation(api.media.finalizeUpload)
  const convex = useConvex()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const editor = useCreateBlockNote()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const displayUrlAssetIdsRef = useRef(new Map<string, string>())

  useEffect(() => {
    if (!note?.content) {
      displayUrlAssetIdsRef.current.clear()
      return
    }

    try {
      displayUrlAssetIdsRef.current.clear()
      const editorContent = replaceMarkdownImageUrls(
        note.content,
        (url, alt) => {
          if (!url.startsWith("inspira-media:")) return undefined

          const assetId = url.slice("inspira-media:".length)
          const displayUrl = note.mediaAssets?.[assetId]?.url

          if (!displayUrl) return undefined

          displayUrlAssetIdsRef.current.set(displayUrl, assetId)

          return `![${alt}](${displayUrl})`
        }
      )
      const blocks = parseMarkdownPreservingBlankParagraphs(
        editor,
        editorContent
      )
      editor.replaceBlocks(
        editor.document,
        blocks.length > 0
          ? blocks
          : [{ type: "paragraph", content: editorContent }]
      )
    } catch {
      editor.replaceBlocks(editor.document, [
        { type: "paragraph", content: note.content }
      ])
    }
  }, [editor, note?.content, note?.mediaAssets])

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

    const content = replaceMarkdownImageUrls(
      serializeDocumentToMarkdown(editor),
      (url, alt) => {
        const assetId = displayUrlAssetIdsRef.current.get(url)

        return assetId ? createNoteMediaReference(assetId, alt) : undefined
      }
    )
    if (!content.trim()) {
      setSaveError("先写一点内容再保存。")
      return
    }

    setIsSaving(true)
    setSaveError(null)

    const payload: {
      content: string
      notes?: string
      tags: string[]
      title?: string
      workspaceId?: string
    } = {
      content: content.slice(0, NOTE_CONTENT_MAX_LENGTH),
      tags: note?.tags ?? []
    }

    if (note?.title) payload.title = note.title
    if (note?.notes) payload.notes = note.notes
    if (note?.workspaceId) payload.workspaceId = note.workspaceId

    onFinish()

    try {
      if (note) {
        await updateNoteMutation({
          id: toInspirationId(note.id),
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

  async function handleImageSelected(file: File | undefined) {
    if (!file || isUploadingImage) return

    if (!isMediaImageMimeType(file.type)) {
      setSaveError("仅支持 JPG、PNG、WebP 或 GIF 图片。")
      return
    }

    if (file.size > MEDIA_IMAGE_MAX_BYTES) {
      setSaveError("图片不能超过 20MB。")
      return
    }

    setIsUploadingImage(true)
    setSaveError("图片上传中...")

    try {
      const { uploadUrl } = await requestMediaUpload({
        kind: "noteImage",
        usage: "noteEmbed",
        mimeType: file.type,
        byteSize: file.size
      })
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload failed.")
      }

      const { storageId } = (await uploadResponse.json()) as {
        storageId: string
      }
      const { assetId } = await finalizeMediaUpload({
        storageId: toStorageId(storageId),
        kind: "noteImage",
        usage: "noteEmbed",
        mimeType: file.type,
        byteSize: file.size
      })
      const assetView = await convex.query(api.media.getAssetUrl, {
        assetId: toMediaAssetId(assetId)
      })
      const displayUrl = assetView?.url
      const nextContent = `${serializeDocumentToMarkdown(editor).trim()}\n\n${
        displayUrl
          ? `![${file.name || "Inspira image"}](${displayUrl})`
          : createNoteMediaReference(assetId, file.name || "Inspira image")
      }`.trim()

      if (displayUrl) {
        displayUrlAssetIdsRef.current.set(displayUrl, assetId)
      }

      const blocks = parseMarkdownPreservingBlankParagraphs(editor, nextContent)

      editor.replaceBlocks(
        editor.document,
        blocks.length > 0
          ? blocks
          : [{ type: "paragraph", content: nextContent }]
      )
      setSaveError("图片已插入，保存后会出现在笔记中。")
    } catch (error) {
      console.error("Failed to upload note image", error)
      setSaveError("图片上传失败，请稍后再试。")
    } finally {
      setIsUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  function requestImageUpload() {
    if (isUploadingImage) return

    if (isLoading) {
      setSaveError("登录状态还在同步，稍后再试一次。")
      return
    }

    if (!isAuthenticated) {
      setSaveError("需要登录后才能上传图片。")
      return
    }

    imageInputRef.current?.click()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      void handleSave()
    }
  }

  const fixedControls =
    typeof document === "undefined"
      ? null
      : createPortal(
          <>
            <button
              type="button"
              title="Close"
              aria-label="Close"
              onClick={onDismiss}
              data-surface-state={surfaceState}
              className={`inspiration-control fixed right-6 top-6 z-[60] grid size-8 place-items-center rounded-full border-0 bg-surface/70 text-lg text-ink-muted shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                controlsVisible ? "" : "inspiration-control--hidden-up"
              }`}>
              <CloseIcon />
            </button>

            <footer
              data-surface-state={surfaceState}
              className="inspiration-control-bar pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex items-center justify-end gap-4 px-6 sm:px-10">
              {saveError ? (
                <p
                  role="status"
                  className={`inspiration-control max-w-[min(360px,52vw)] text-right text-xs font-medium text-ink-muted ${
                    controlsVisible ? "" : "inspiration-control--hidden-down"
                  }`}>
                  {saveError}
                </p>
              ) : null}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) =>
                  void handleImageSelected(event.currentTarget.files?.[0])
                }
              />
              <button
                form={formId}
                type="submit"
                disabled={isSaving || isLoading || isUploadingImage}
                className={`inspiration-control pointer-events-auto rounded-full border border-line bg-surface/88 px-7 py-3 text-xs font-semibold uppercase text-ink-muted shadow-[0_18px_42px_rgb(37_43_53_/_0.16)] backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-60 ${
                  controlsVisible ? "" : "inspiration-control--hidden-down"
                }`}>
                Save (Ctrl+Enter)
              </button>
            </footer>
          </>,
          document.body
        )

  return (
    <>
      <form
        id={formId}
        className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-7 sm:px-10 lg:px-12"
        onKeyDownCapture={handleKeyDown}
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}>
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
                  matchSlashItems(
                    getDefaultReactSlashMenuItems(editor).map((item) =>
                      item.title === "Image"
                        ? {
                            ...item,
                            onItemClick: () => requestImageUpload()
                          }
                        : item
                    ),
                    query
                  )
                }
              />
            </BlockNoteView>
          </div>
        </div>
      </form>
      {fixedControls}
    </>
  )
}
