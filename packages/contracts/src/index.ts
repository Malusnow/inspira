export type InspirationType = "page" | "image" | "quote" | "note" | "video"

export const NOTE_TITLE_MAX_LENGTH = 120
export const NOTE_CONTENT_MAX_LENGTH = 10000
export const NOTE_NOTES_MAX_LENGTH = 5000
export const NOTE_TAG_MAX_COUNT = 12
export const NOTE_TAG_MAX_LENGTH = 40
export const WORKSPACE_NAME_MAX_LENGTH = 60

export interface CreateNoteInput {
  title?: string
  content: string
  notes?: string
  tags?: string[]
  workspaceId?: string
}

export interface UpdateNoteInput extends CreateNoteInput {
  id: string
}

export interface NoteInspiration {
  id: string
  type: "note"
  title?: string
  content: string
  notes?: string
  tags: string[]
  workspaceId?: string
  createdAt: number
  updatedAt: number
}

export interface WorkspacePreviewItem {
  id: string
  type: InspirationType
  title?: string
  text?: string
  imageUrl?: string
  createdAt: number
}

/** Thumbnails only: counts live on `WorkspaceSummary.itemCount`. */
export interface WorkspacePreview {
  items: WorkspacePreviewItem[]
}

export interface WorkspaceSummary {
  id: string
  name: string
  itemCount: number
  preview: WorkspacePreview
  createdAt: number
  updatedAt: number
}

export interface WorkspaceDetail {
  id: string
  name: string
  items: NoteInspiration[]
  createdAt: number
  updatedAt: number
}

export function normalizeWorkspaceName(name: string) {
  return name.trim()
}

export function getWorkspaceNameKey(name: string) {
  return normalizeWorkspaceName(name).toLocaleLowerCase()
}

export function validateWorkspaceName(name: string) {
  const normalizedName = normalizeWorkspaceName(name)

  if (!normalizedName) {
    throw new Error("Workspace name is required.")
  }

  if (normalizedName.length > WORKSPACE_NAME_MAX_LENGTH) {
    throw new Error(
      `Workspace name must be ${WORKSPACE_NAME_MAX_LENGTH} characters or fewer.`
    )
  }

  return normalizedName
}
