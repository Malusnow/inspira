import {
  CAPTURE_NOTE_MAX_LENGTH,
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH
} from "@inspira/contracts"
import { useCallback, useEffect, useRef, useState } from "react"

import { BrandMark, Divider, PopupFrame } from "~/components/popup-shell"
import { COLORS } from "~/components/theme"
import { openTab, sendRuntimeMessage } from "~/lib/browser"
import type { ExtensionResponse } from "~/lib/messages"

const DETAILS_FAILED_COPY = "补充内容还没有保存成功，改动一下会自动重试。"

function SavedHeader() {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          paddingBottom: 15
        }}>
        <BrandMark />
        <span
          style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: "-0.2px" }}>
          已保存到 Inspira
        </span>
      </div>
      <Divider />
    </>
  )
}

/**
 * The补充框 shared by every capture kind: tags and a remark write back to the
 * same content through the worker. Refs hold the values that get persisted so a
 * debounced write never regresses a tag added in the meantime.
 */
export function SavedState({
  inspirationId,
  landingUrl,
  onAutoClose
}: {
  inspirationId: string
  landingUrl: string
  onAutoClose?: () => void
}) {
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState("")
  const [note, setNote] = useState("")
  const [detailsFailed, setDetailsFailed] = useState(false)
  const tagsRef = useRef<string[]>([])
  const noteRef = useRef("")
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  useEffect(() => {
    autoCloseTimer.current = setTimeout(() => onAutoClose?.(), 5000)

    return () => {
      clearTimeout(noteTimer.current)
      clearTimeout(autoCloseTimer.current)
    }
  }, [onAutoClose])

  const keepOpenForUserInput = useCallback(() => {
    clearTimeout(autoCloseTimer.current)
  }, [])

  const writeBack = useCallback(async () => {
    const nextNote = noteRef.current.trim()

    let response: ExtensionResponse

    try {
      response = await sendRuntimeMessage<ExtensionResponse>({
        type: "update-details",
        inspirationId,
        tags: tagsRef.current,
        ...(nextNote ? { note: nextNote } : {})
      })
    } catch {
      setDetailsFailed(true)
      return
    }

    setDetailsFailed(
      !(response.ok && response.type === "update-details" && response.saved)
    )
  }, [inspirationId])

  const updateTags = useCallback(
    (nextTags: string[]) => {
      keepOpenForUserInput()
      tagsRef.current = nextTags
      setTags(nextTags)
      void writeBack()
    },
    [keepOpenForUserInput, writeBack]
  )

  const updateNote = useCallback(
    (value: string) => {
      keepOpenForUserInput()
      noteRef.current = value
      setNote(value)
      clearTimeout(noteTimer.current)
      noteTimer.current = setTimeout(() => void writeBack(), 600)
    },
    [keepOpenForUserInput, writeBack]
  )

  const commitTagDraft = useCallback(() => {
    const tag = tagDraft.trim()
    setTagDraft("")

    if (!tag || tags.includes(tag) || tags.length >= NOTE_TAG_MAX_COUNT) {
      return
    }

    updateTags([...tags, tag])
  }, [tagDraft, tags, updateTags])

  return (
    <PopupFrame>
      <div
        onFocusCapture={keepOpenForUserInput}
        onPointerDown={keepOpenForUserInput}>
        <SavedHeader />

        <div style={{ padding: "13px 0" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              minHeight: 22
            }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: COLORS.chipBackground,
                  color: COLORS.chipText,
                  fontSize: 12.5,
                  fontWeight: 500
                }}>
                {tag}
                <button
                  type="button"
                  aria-label={`移除标签 ${tag}`}
                  onClick={() =>
                    updateTags(tags.filter((item) => item !== tag))
                  }
                  style={{
                    border: "none",
                    padding: 0,
                    background: "transparent",
                    color: "inherit",
                    fontFamily: "inherit",
                    fontSize: 13,
                    lineHeight: 1,
                    opacity: 0.5,
                    cursor: "pointer"
                  }}>
                  ×
                </button>
              </span>
            ))}
            <input
              className="inspira-field"
              value={tagDraft}
              maxLength={NOTE_TAG_MAX_LENGTH}
              placeholder="添加标签…"
              onChange={(event) => {
                keepOpenForUserInput()
                setTagDraft(event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault()
                  commitTagDraft()
                } else if (
                  event.key === "Backspace" &&
                  !tagDraft &&
                  tags.length > 0
                ) {
                  updateTags(tags.slice(0, -1))
                }
              }}
              onBlur={commitTagDraft}
              style={{
                flex: 1,
                minWidth: 96,
                border: "none",
                background: "transparent",
                fontFamily: "inherit",
                fontSize: 14.5,
                color: COLORS.text
              }}
            />
          </div>
        </div>

        <Divider />

        <div style={{ padding: "13px 0" }}>
          <textarea
            className="inspira-field"
            value={note}
            maxLength={CAPTURE_NOTE_MAX_LENGTH}
            placeholder="写点备注…"
            onChange={(event) => updateNote(event.target.value)}
            style={{
              display: "block",
              width: "100%",
              minHeight: 62,
              resize: "none",
              border: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 14.5,
              lineHeight: 1.65,
              color: COLORS.text
            }}
          />
        </div>

        {detailsFailed ? (
          <div
            style={{ fontSize: 12.5, color: COLORS.warning, marginBottom: 6 }}>
            {DETAILS_FAILED_COPY}
          </div>
        ) : null}

        <a
          href={landingUrl}
          onClick={(event) => {
            event.preventDefault()
            void openTab(landingUrl)
          }}
          style={{
            alignSelf: "flex-start",
            fontSize: 12.5,
            color: COLORS.placeholder,
            textDecoration: "none"
          }}>
          在 Inspira 中查看
        </a>
      </div>
    </PopupFrame>
  )
}
