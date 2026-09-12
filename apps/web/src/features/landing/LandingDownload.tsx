import { SignInButton } from "@clerk/react"
import { LogoChromeIcon, SystemSearchIcon } from "tdesign-icons-react"

import { sectionTitleClass } from "./landingStyles"

export function LandingDownload() {
  return (
    <section className="border-y border-[#f0eeea] bg-white px-5 py-20 sm:px-11" id="download">
      <div className="mx-auto max-w-[700px] text-center">
        <h2 className={sectionTitleClass}>准备好时，一键装进浏览器。</h2>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2.5 rounded-[10px] border border-[#20201e] bg-[#20201e] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-brand-line"
            type="button"
          >
            <LogoChromeIcon className="h-[18px] w-[18px]" />
            Chrome 插件
          </button>
          <button
            className="inline-flex items-center justify-center gap-2.5 rounded-[10px] border border-[#e0ded8] bg-transparent px-6 py-3 text-sm font-bold text-[#20201e] transition hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-brand-line"
            type="button"
          >
            <SystemSearchIcon className="h-[18px] w-[18px]" />
            Edge 兼容
          </button>
        </div>
        <p className="mt-6 text-[13px] leading-[1.65] text-[#777570]">
          插件发布地址确认后会接入这里。已有账户？
          <SignInButton mode="modal">
            <button
              className="border-0 bg-transparent p-0 text-brand-ink hover:text-brand-ink-hover focus:outline-none focus:ring-2 focus:ring-brand-line"
              type="button"
            >
              登录 Inspira
            </button>
          </SignInButton>
        </p>
      </div>
    </section>
  )
}
