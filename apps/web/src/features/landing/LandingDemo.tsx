import { PlayIcon, ViewModuleIcon } from "tdesign-icons-react"

import { sectionClass, sectionTitleClass } from "./landingStyles"

export function LandingDemo({ onOpenVideo }: { onOpenVideo: () => void }) {
  return (
    <section className={sectionClass} id="demo">
      <h2 className={sectionTitleClass}>看到喜欢的，顺手留下。</h2>
      <button
        className="relative my-10 block aspect-video w-full cursor-pointer overflow-hidden rounded-lg border-0 bg-[#e8e6e1] sm:my-12"
        type="button"
        onClick={onOpenVideo}
        aria-label="打开演示视频"
      >
        <div className="grid h-full place-items-center bg-[linear-gradient(135deg,rgba(65,98,167,0.18),rgba(227,141,97,0.16)),#eceee9] text-[#777570]">
          <ViewModuleIcon className="h-22 w-22 text-brand/50" />
          <span className="-mt-20 text-lg font-bold text-[#20201e]">
            Inspira capture demo
          </span>
        </div>
        <span className="absolute left-1/2 top-1/2 grid h-18 w-18 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-[0_4px_20px_rgba(32,32,30,0.16)]">
          <PlayIcon className="ml-1 h-6.5 w-6.5 text-[#20201e]" />
        </span>
      </button>
      <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-15">
        <Step number="1" text="浏览网页" />
        <Step number="2" text="一键保存" />
        <Step number="3" text="回到 Inspira 重新发现" />
      </div>
    </section>
  )
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-[13px] font-bold text-brand">
        {number}
      </span>
      <strong className="text-sm font-semibold text-[#55524e]">{text}</strong>
    </div>
  )
}
