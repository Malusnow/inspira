import type { InspirationItem } from "@inspira/contracts"
import { useMutation } from "convex/react"
import { useCallback, useState } from "react"
import { MessagePlugin } from "tdesign-react"

import { api } from "../../../../../convex/_generated/api"
import { toInspirationId } from "../../lib/convexIds"

export interface UseNoteDeletionOptions {
  /** Runs after a successful delete, e.g. to close a detail layer. */
  onDeleted?: (note: InspirationItem) => void
}

export interface UseNoteDeletionResult {
  /** Note awaiting confirmation, or null while the dialog stays closed. */
  pendingNote: InspirationItem | null
  isDeleting: boolean
  requestDelete: (note: InspirationItem) => void
  cancel: () => void
  confirm: () => Promise<void>
}

/**
 * Delete-confirmation flow shared by the All page, the note detail and the
 * workspace detail. All three used to re-implement the same request / toast /
 * in-flight guard trio around `notes.remove`.
 */
export function useNoteDeletion({
  onDeleted
}: UseNoteDeletionOptions = {}): UseNoteDeletionResult {
  const removeNote = useMutation(api.notes.remove)
  const [pendingNote, setPendingNote] = useState<InspirationItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const requestDelete = useCallback((note: InspirationItem) => {
    setPendingNote(note)
  }, [])

  const cancel = useCallback(() => {
    if (isDeleting) return

    setPendingNote(null)
  }, [isDeleting])

  const confirm = useCallback(async () => {
    if (!pendingNote || isDeleting) return

    const note = pendingNote

    setIsDeleting(true)

    try {
      await removeNote({ id: toInspirationId(note.id) })
      setPendingNote(null)
      onDeleted?.(note)
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
    } finally {
      setIsDeleting(false)
    }
  }, [isDeleting, onDeleted, pendingNote, removeNote])

  return { pendingNote, isDeleting, requestDelete, cancel, confirm }
}
