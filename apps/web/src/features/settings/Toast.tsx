export type ToastMessage = {
  tone: "success" | "error"
  text: string
}

export type ToastProps = {
  message: ToastMessage
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[1000] rounded-lg border px-4 py-2 text-sm shadow-lg backdrop-blur transition ${
        message.tone === "success"
          ? "border-line bg-surface text-ink-strong"
          : "border-danger/30 bg-surface text-danger"
      }`}>
      {message.text}
    </div>
  )
}
