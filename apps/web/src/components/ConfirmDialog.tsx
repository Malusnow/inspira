import { Dialog } from "tdesign-react"

export interface ConfirmDialogProps {
  isLoading?: boolean
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  isLoading = false,
  visible,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  return (
    <Dialog
      visible={visible}
      header={false}
      footer={false}
      closeBtn={false}
      placement="center"
      width="min(360px, calc(100vw - 32px))"
      closeOnEscKeydown={!isLoading}
      closeOnOverlayClick={!isLoading}
      dialogClassName="!overflow-hidden !rounded-lg border border-line bg-surface text-ink shadow-xl [&_.t-dialog__body]:!overflow-hidden [&_.t-dialog__body]:!rounded-lg [&_.t-dialog__body]:bg-surface [&_.t-dialog__body]:p-0"
      destroyOnClose
      onClose={onCancel}
      onCancel={onCancel}
      onConfirm={onConfirm}>
      <div className="rounded-lg bg-surface px-6 py-5 text-start text-ink">
        <h3 className="text-base font-semibold leading-6 text-ink-strong">
          确认删除这条灵感吗
        </h3>
        <p className="mt-2 text-sm leading-5 text-ink-muted">删除后不可恢复</p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="inline-flex h-9 min-w-16 items-center justify-center rounded-md border border-line bg-canvas px-4 text-sm font-medium text-ink transition hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-60">
            取消
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="inline-flex h-9 min-w-16 items-center justify-center rounded-md border border-transparent bg-danger px-4 text-sm font-medium text-white transition hover:bg-danger/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 disabled:cursor-default disabled:opacity-70">
            删除
          </button>
        </div>
      </div>
    </Dialog>
  )
}
