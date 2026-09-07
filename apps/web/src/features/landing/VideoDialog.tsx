import { CloseIcon, PlayCircleIcon } from "tdesign-icons-react"

export function VideoDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[400] grid place-items-center bg-black/50 p-5 sm:p-10"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose()
        }
      }}
      role="presentation"
    >
      <section
        className="relative aspect-video w-full max-w-[900px] overflow-hidden rounded-lg bg-[#050505]"
        aria-label="演示视频播放区域"
        role="dialog"
      >
        <button
          className="absolute right-4 top-4 z-[1] grid h-9 w-9 place-items-center rounded-full border-0 bg-white/15 text-white hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70"
          type="button"
          onClick={onClose}
          aria-label="关闭演示视频"
        >
          <CloseIcon className="h-[18px] w-[18px]" />
        </button>
        <div className="flex h-full items-center justify-center gap-4 text-base text-white">
          <PlayCircleIcon className="h-12 w-12 opacity-50" />
          演示视频播放区域
        </div>
      </section>
    </div>
  )
}
