import { SignInButton } from "@clerk/react"
import { SignUpButton } from "@clerk/react"

import { primaryLinkClass, secondaryButtonClass } from "./landingStyles"

export function LandingFooter() {
  return (
    <>
      <section className="bg-brand/5 px-5 py-24 text-center sm:px-11">
        <h2 className="mx-auto mb-7 max-w-[520px] text-4xl font-bold leading-tight text-[#20201e]">
          下一次灵感出现时，别让它溜走。
        </h2>
        <div className="flex flex-col justify-center gap-3.5 sm:flex-row sm:flex-wrap">
          <a className={`${primaryLinkClass} min-h-12 px-7 py-3.5 text-[15px]`} href="#download">
            获取 Inspira 插件
          </a>
          <SignUpButton mode="modal">
            <button
              className={`${secondaryButtonClass} min-h-12 px-7 py-3.5 text-[15px]`}
              type="button"
            >
              登录 / 注册 Web App
            </button>
          </SignUpButton>
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1100px] flex-col gap-6 border-t border-[#f0eeea] px-5 py-12 sm:px-11 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-7">
          <FooterLink href="#top">Inspira</FooterLink>
          <FooterLink href="#features">产品</FooterLink>
          <FooterLink href="#download">浏览器插件</FooterLink>
          <FooterLink href="#privacy">隐私</FooterLink>
        </div>
        <SignInButton mode="modal">
          <button
            className="w-fit border-0 bg-transparent p-0 text-[13px] font-medium text-[#777570] hover:text-[#20201e] focus:outline-none focus:ring-2 focus:ring-brand-line"
            type="button"
          >
            登录
          </button>
        </SignInButton>
      </footer>
    </>
  )
}

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      className="text-[13px] font-medium text-[#777570] no-underline hover:text-[#20201e] focus:outline-none focus:ring-2 focus:ring-brand-line"
      href={href}
    >
      {children}
    </a>
  )
}
