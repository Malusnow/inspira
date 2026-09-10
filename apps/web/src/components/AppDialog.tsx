import type { ReactNode } from "react"
import { Dialog } from "tdesign-react"

/**
 * Shared chrome for every app dialog so the surface, radius, border and body
 * reset stay identical across the project.
 *
 * The `!` prefixes are load-bearing: TDesign ships unlayered CSS, which outranks
 * Tailwind's `@layer utilities`. Without them TDesign's own (tinted, semi
 * transparent) background and border colors win over ours.
 */
export const APP_DIALOG_DIALOG_CLASS =
  "!overflow-hidden !rounded-2xl !border !border-solid !border-line !bg-surface text-ink shadow-xl [&_.t-dialog__body]:!overflow-hidden [&_.t-dialog__body]:!rounded-2xl [&_.t-dialog__body]:!bg-surface [&_.t-dialog__body]:p-0"

export interface AppDialogProps {
  visible: boolean
  /** When false, Esc and overlay clicks are ignored (e.g. while saving). */
  dismissible?: boolean
  /** Preferred width in px; always capped to the viewport. */
  width?: number
  onCancel: () => void
  children: ReactNode
}

export function AppDialog({
  visible,
  dismissible = true,
  width = 360,
  onCancel,
  children
}: AppDialogProps) {
  return (
    <Dialog
      visible={visible}
      header={false}
      footer={false}
      closeBtn={false}
      placement="center"
      width={`min(${width}px, calc(100vw - 32px))`}
      closeOnEscKeydown={dismissible}
      closeOnOverlayClick={dismissible}
      dialogClassName={APP_DIALOG_DIALOG_CLASS}
      destroyOnClose
      onClose={onCancel}
      onCancel={onCancel}>
      {children}
    </Dialog>
  )
}
