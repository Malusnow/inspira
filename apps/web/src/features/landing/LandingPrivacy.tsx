import { LockOnIcon } from "tdesign-icons-react"

import { sectionTitleClass } from "./landingStyles"

export function LandingPrivacy() {
  return (
    <section className="mx-auto max-w-[640px] px-5 py-20 text-center sm:px-11" id="privacy">
      <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[14px] bg-brand/10 text-brand-ink">
        <LockOnIcon className="h-[22px] w-[22px]" />
      </span>
      <h2 className={sectionTitleClass}>你的灵感，只属于你。</h2>
      <p className="mx-auto mt-4 text-[15px] leading-[1.65] text-[#777570]">
        Inspira 是你的私人空间。你保存的网页、图片、笔记和工作区默认不会公开。我们不出售你的数据，也不用它训练模型。
      </p>
    </section>
  )
}
