import {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH
} from "@inspira/contracts"
import { useMutation } from "convex/react"
import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { AddIcon } from "tdesign-icons-react"
import { Alert, Button, Input, Textarea } from "tdesign-react"

import { api } from "../../../../../convex/_generated/api"
import { parseTagText, toErrorMessage } from "./noteFormat"

export interface CreateNoteFormProps {
  /** Called after a Note is successfully created (for page state updates). */
  onCreated?: () => void
}

export function CreateNoteForm({ onCreated }: CreateNoteFormProps) {
  const createNote = useMutation(api.notes.create)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const parsedTags = useMemo(() => parseTagText(tags), [tags])

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
      onCreated?.()
    } catch (caughtError) {
      setError(toErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 gap-3">
        <Input
          label="Title"
          placeholder="Optional"
          value={title}
          maxlength={NOTE_TITLE_MAX_LENGTH}
          onChange={(value) => setTitle(String(value))}
        />
        <Input
          label="Tags"
          placeholder="Comma, separated"
          value={tags}
          onChange={(value) => setTags(String(value))}
        />
      </div>
      <Textarea
        placeholder="Write a note"
        value={content}
        maxlength={NOTE_CONTENT_MAX_LENGTH}
        autosize={{ minRows: 8, maxRows: 16 }}
        onChange={(value) => setContent(String(value))}
      />
      {error ? <Alert theme="error" message={error} /> : null}
      {success ? <Alert theme="success" message={success} /> : null}
      <div className="flex justify-end">
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
