export type InspirationType =
  | "page"
  | "image"
  | "quote"
  | "note"
  | "video"

export const NOTE_TITLE_MAX_LENGTH = 120
export const NOTE_CONTENT_MAX_LENGTH = 10000
export const NOTE_TAG_MAX_COUNT = 12
export const NOTE_TAG_MAX_LENGTH = 40

export interface CreateInspirationInput {
  type: InspirationType
  title?: string
  content?: string
  sourceUrl?: string
  imageUrl?: string
  workspaceId?: string
  tags?: string[]
}

export interface CreateNoteInput {
  title?: string
  content: string
  tags?: string[]
  workspaceId?: string
}

export interface NoteInspiration {
  id: string
  type: "note"
  title?: string
  content: string
  tags: string[]
  workspaceId?: string
  createdAt: number
  updatedAt: number
}
