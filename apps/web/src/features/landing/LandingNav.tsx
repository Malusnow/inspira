import { SignInButton } from "@clerk/react"

import { primaryLinkClass } from "./landingStyles"

export function LandingNav({ isScrolled }: { isScrolled: boolean }) {
  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[200] flex h-[68px] items-center justify-between gap-6 bg-[#f7f6f2]/90 px-4 backdrop-blur-2xl sm:px-11 ${
        isScrolled ? "shadow-[0_1px_0_rgba(32,32,30,0.08)]" : ""
      }`}
    >
      <a className="text-xl font-bold text-[#20201e] no-underline font-['Baskerville','Palatino','Georgia',ui-serif,serif]" href="#top">
        Inspira
      </a>
      <div
        className="hidden items-center gap-8 text-sm font-medium md:flex"
        aria-label="Landing navigation"
      >
        <a className="text-[#777570] no-underline hover:text-[#20201e]" href="#features">
          产品介绍
        </a>
        <a className="text-[#777570] no-underline hover:text-[#20201e]" href="#demo">
          使用方式
        </a>
        <a className="text-[#777570] no-underline hover:text-[#20201e]" href="#download">
          浏览器插件
        </a>
        <a className="text-[#777570] no-underline hover:text-[#20201e]" href="#privacy">
          隐私
        </a>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3.5">
        <SignInButton mode="modal">
          <button
            className="rounded-lg border-0 bg-transparent px-3.5 py-2 text-sm font-medium text-[#20201e] hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-brand-line"
            type="button"
          >
            登录
          </button>
        </SignInButton>
        <a className={`${primaryLinkClass} hidden sm:inline-flex`} href="#download">
          获取浏览器插件
        </a>
      </div>
    </nav>
  )
}
