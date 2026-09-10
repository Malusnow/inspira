import { getWorkspaceNameKey, WORKSPACE_NAME_MAX_LENGTH } from "@inspira/contracts"
import { useMemo, useState } from "react"

export interface UseWorkspaceNameFieldOptions {
  /** Seeds the draft; the owner re-mounts the field whenever it reopens. */
  initialName?: string
  /** Names that would collide. Callers exclude the entity being renamed. */
  existingNames: string[]
  /** Current name of the entity, so a no-op rename stays disabled. */
  currentName?: string
}

export interface UseWorkspaceNameFieldResult {
  name: string
  setName: (name: string) => void
  trimmedName: string
  /** Field-level errors, in display order. */
  fieldErrors: string[]
  canSubmit: boolean
}

/**
 * Workspace-name draft validated with the same normalisation the server uses
 * (`getWorkspaceNameKey`), so the client-side duplicate check and the server's
 * unique index agree. Shared by the create and rename dialogs.
 */
export function useWorkspaceNameField({
  initialName = "",
  existingNames,
  currentName
}: UseWorkspaceNameFieldOptions): UseWorkspaceNameFieldResult {
  const [name, setName] = useState(initialName)
  const trimmedName = name.trim()
  const nameKey = getWorkspaceNameKey(name)
  const duplicateName = useMemo(
    () =>
      existingNames.some(
        (existingName) => getWorkspaceNameKey(existingName) === nameKey
      ),
    [existingNames, nameKey]
  )
  const isTooLong = trimmedName.length > WORKSPACE_NAME_MAX_LENGTH
  const isUnchanged =
    currentName !== undefined && nameKey === getWorkspaceNameKey(currentName)
  const fieldErrors = useMemo(() => {
    const errors: string[] = []

    if (duplicateName) errors.push("已有同名工作区")
    if (isTooLong) {
      errors.push(`名称不能超过 ${WORKSPACE_NAME_MAX_LENGTH} 个字符`)
    }

    return errors
  }, [duplicateName, isTooLong])

  return {
    name,
    setName,
    trimmedName,
    fieldErrors,
    canSubmit:
      trimmedName.length > 0 && !duplicateName && !isTooLong && !isUnchanged
  }
}
