import { AppDialog } from "./AppDialog"

export interface ConfirmDialogProps {
  cancelText?: string
  confirmText?: string
  description?: string
  intent?: "danger" | "primary"
  isLoading?: boolean
  title: string
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
}

const CONFIRM_PILL_CLASS: Record<"danger" | "primary", string> = {
  danger:
    "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/30",
  primary:
    "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand/30"
}

/**
 * Centered, single-column confirm dialog with a full-width pill button and a
 * plain text cancel underneath — modeled after the mymind "Delete this space?"
 * pattern, but kept compact for our neutral palette and zoned inside the shared
 * AppDialog chrome (border, radius, ESC, overlay dismiss) so the surface still
 * matches every other dialog in the app.
 */
export function ConfirmDialog({
  cancelText = "取消",
  confirmText = "确认",
  description,
  intent = "primary",
  isLoading = false,
  title,
  visible,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  return (
    <AppDialog
      visible={visible}
      dismissible={!isLoading}
      width={460}
      onCancel={onCancel}>
      <div className="px-5 pb-5 pt-6 text-center text-ink-strong">
        <h3 className="text-[22px] font-semibold leading-snug">{title}</h3>
        {description ? (
          <p className="mx-auto mt-3.5 max-w-[340px] text-[13px] leading-6 text-ink-muted">
            {description}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col items-stretch gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex h-11 w-full items-center justify-center rounded-full text-[15px] font-semibold tracking-[0.04em] transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-default disabled:opacity-70 ${CONFIRM_PILL_CLASS[intent]}`}>
            {confirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium text-ink-muted transition hover:bg-surface-hover hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-default disabled:opacity-60">
            {cancelText}
          </button>
        </div>
      </div>
    </AppDialog>
  )
}