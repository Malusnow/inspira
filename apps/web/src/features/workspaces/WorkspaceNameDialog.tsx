import { WORKSPACE_NAME_MAX_LENGTH } from "@inspira/contracts"

import { AppDialog } from "../../components/AppDialog"
import { useWorkspaceNameField } from "./useWorkspaceNameField"

export interface WorkspaceNameDialogProps {
  visible: boolean
  title: string
  description?: string
  placeholder: string
  /** Submitting button label, idle vs. pending. */
  submitText: string
  pendingText: string
  /** Prefilled draft; re-seeded every time the dialog is reopened. */
  initialName?: string
  /** Names that would collide; callers exclude the entity being renamed. */
  existingNames: string[]
  /** Current name of the entity, so a no-op rename stays disabled. */
  currentName?: string
  /** Server-side failure message, shown below the field errors. */
  error?: string
  isLoading?: boolean
  onCancel: () => void
  onSubmit: (name: string) => Promise<void> | void
}

const INPUT_ID = "workspace-name"

/**
 * Centered single-column dialog shared by the two workspace-name flows (create
 * and rename). They differ only in copy, so they share one field, one
 * validation source and one layout instead of two drifting implementations.
 */
export function WorkspaceNameDialog({
  visible,
  isLoading = false,
  onCancel,
  ...form
}: WorkspaceNameDialogProps) {
  return (
    <AppDialog
      visible={visible}
      dismissible={!isLoading}
      width={460}
      onCancel={onCancel}>
      <WorkspaceNameForm {...form} isLoading={isLoading} onCancel={onCancel} />
    </AppDialog>
  )
}

interface WorkspaceNameFormProps
  extends Omit<WorkspaceNameDialogProps, "visible" | "isLoading" | "onCancel"> {
  isLoading: boolean
  onCancel: () => void
}

/**
 * The body is a child of the Dialog on purpose: the shared dialog uses
 * `destroyOnClose`, which unmounts its children after the exit animation, so the
 * draft is discarded on close and re-seeded from whichever surface opened it.
 */
function WorkspaceNameForm({
  title,
  description,
  placeholder,
  submitText,
  pendingText,
  initialName,
  existingNames,
  currentName,
  error,
  isLoading,
  onCancel,
  onSubmit
}: WorkspaceNameFormProps) {
  const { name, setName, trimmedName, fieldErrors, canSubmit } =
    useWorkspaceNameField({ initialName, existingNames, currentName })

  function handleCancel() {
    if (isLoading) return

    onCancel()
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()

        if (canSubmit && !isLoading) void onSubmit(trimmedName)
      }}
      className="px-5 pb-5 pt-6 text-center text-ink-strong">
      <h2 className="text-[22px] font-semibold leading-snug">{title}</h2>
      {description ? (
        <p className="mx-auto mt-3.5 max-w-[360px] text-[13px] leading-6 text-ink-muted">
          {description}
        </p>
      ) : null}
      <label className="sr-only" htmlFor={INPUT_ID}>
        {title}
      </label>
      <input
        id={INPUT_ID}
        value={name}
        maxLength={WORKSPACE_NAME_MAX_LENGTH + 1}
        autoFocus
        placeholder={placeholder}
        onChange={(event) => setName(event.target.value)}
        className="mt-6 h-12 w-full rounded-lg border border-line bg-canvas px-4 text-center text-sm text-ink-strong outline-none placeholder:text-ink-muted/70 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
      />

      {fieldErrors.map((fieldError) => (
        <p key={fieldError} className="mt-2 text-xs text-danger">
          {fieldError}
        </p>
      ))}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={!canSubmit || isLoading}
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-[15px] font-semibold text-white transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-default disabled:bg-line disabled:text-ink-muted">
        {isLoading ? pendingText : submitText}
      </button>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleCancel}
        className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium text-ink-muted transition hover:bg-surface-hover hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-default disabled:opacity-60">
        取消
      </button>
    </form>
  )
}
