import {
  AddIcon,
  CopyIcon,
  LogoChromeIcon,
  PlayCircleIcon,
  SearchIcon
} from "tdesign-icons-react"
import type { ReactNode } from "react"

import heroAsset from "../../assets/hero.png"
import { eyebrowClass, primaryLinkClass, secondaryButtonClass } from "./landingStyles"

export function LandingHero({ onOpenVideo }: { onOpenVideo: () => void }) {
  return (
    <section
      className="relative mx-auto grid min-h-[760px] max-w-[1200px] grid-cols-1 items-center gap-14 px-5 pb-16 pt-28 sm:px-11 sm:pb-20 sm:pt-32 lg:grid-cols-[minmax(0,0.86fr)_minmax(460px,1.14fr)]"
      id="top"
    >
      <div className="absolute -right-44 bottom-18 h-[300px] w-[520px] bg-[radial-gradient(circle_at_center,rgba(105,142,255,0.18),transparent_68%)]" />
      <div className="relative">
        <p className={eyebrowClass}>Your Private Inspiration Space</p>
        <h1 className="my-5 max-w-[540px] text-4xl font-bold leading-[1.12] text-[#20201e] sm:text-[52px]">
          把触动你的，留在这里。
        </h1>
        <p className="mb-8 max-w-[440px] text-base leading-[1.65] text-[#777570] sm:text-[17px]">
          保存网页、图片、文字与稍纵即逝的想法。在需要的时候，再次找到它们。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a className={primaryLinkClass} href="#download">
            获取浏览器插件
          </a>
          <button className={secondaryButtonClass} type="button" onClick={onOpenVideo}>
            <PlayCircleIcon className="h-[18px] w-[18px]" />
            观看 60 秒演示
          </button>
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#a09b94]">
          <LogoChromeIcon className="h-3.5 w-3.5" />
          支持 Chrome 与 Chromium 浏览器
        </p>
      </div>
      <div className="relative z-[1] flex justify-start lg:justify-center" aria-label="浏览器保存演示">
        <BrowserMockup />
      </div>
    </section>
  )
}

function BrowserMockup() {
  return (
    <div className="w-full max-w-[540px] overflow-hidden rounded-[14px] border border-[#e8e6e1] bg-white shadow-[0_24px_64px_rgba(32,32,30,0.13)]">
      <div className="flex items-center gap-[7px] border-b border-[#f0eeea] bg-[#fafaf8] px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e8a5a5]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e8d5a5]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#a5d4a5]" />
        <span className="flex-1 rounded-[5px] border border-[#f0eeea] bg-white px-2.5 py-1 text-center text-[11px] leading-none text-[#a09b94]">
          refactoringui.com
        </span>
      </div>
      <div className="relative min-h-[290px] p-4 sm:min-h-[330px]">
        <div className="grid min-h-[258px] place-items-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,rgba(108,99,255,0.18),rgba(87,140,122,0.2)),#eef0ec] text-center sm:min-h-[298px]">
          <img
            className="w-[210px] max-w-[48%] drop-shadow-[0_20px_32px_rgba(49,42,116,0.22)]"
            src={heroAsset}
            alt=""
          />
          <div className="-mt-4 grid gap-1.5">
            <span className="text-[11px] text-[#a09b94]">Design Systems</span>
            <strong className="text-xl text-[#20201e]">交互细节与界面灵感</strong>
          </div>
        </div>
        <div
          className="absolute right-4 top-[60px] grid w-44 gap-0.5 rounded-[10px] border border-[#f0eeea] bg-white py-2 shadow-[0_10px_32px_rgba(32,32,30,0.14)] sm:right-[30px] sm:w-[184px]"
          aria-hidden="true"
        >
          <ContextItem icon={<CopyIcon className="h-3.5 w-3.5" />} text="复制" />
          <ContextItem icon={<SearchIcon className="h-3.5 w-3.5" />} text="搜索" />
          <hr className="mx-2.5 my-1 h-px border-0 bg-[#f0eeea]" />
          <strong className="flex items-center gap-2 px-3.5 py-2 text-[13px] font-bold text-brand-ink">
            <AddIcon className="h-3.5 w-3.5" /> Add to Inspira
          </strong>
        </div>
      </div>
    </div>
  )
}

function ContextItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-2 px-3.5 py-2 text-[13px] text-[#20201e]">
      {icon}
      {text}
    </span>
  )
}
