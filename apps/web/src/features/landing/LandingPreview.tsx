import type { MasonryPreviewItem } from "./landingData"
import { masonryItems } from "./landingData"
import { sectionClass, sectionTitleClass } from "./landingStyles"

const imageToneClass: Record<Extract<MasonryPreviewItem, { kind: "image" }>["tone"], string> = {
  amber: "bg-[linear-gradient(135deg,#ecd8bd,#f6efe5)]",
  green: "min-h-[168px] bg-[linear-gradient(135deg,#cbded2,#eef3ee)]",
  rose: "min-h-36 bg-[linear-gradient(135deg,#ecd0cd,#f7eeee)]",
  sky: "bg-[linear-gradient(135deg,#c7dced,#edf4f7)]",
  violet: "min-h-[154px] bg-[linear-gradient(135deg,#d6d2ed,#f0effe)]"
}

export function LandingPreview() {
  return (
    <section className="border-y border-[#f0eeea] bg-white">
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>所有灵感，自然汇聚。</h2>
        <div className="mt-12 columns-2 gap-4 md:columns-3 lg:columns-5">
          {masonryItems.map((item, index) => (
            <MasonryItem item={item} key={`${item.kind}-${index}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

function MasonryItem({ item }: { item: MasonryPreviewItem }) {
  if (item.kind === "note") {
    return (
      <article className="mb-4 block break-inside-avoid whitespace-pre-line rounded-lg bg-[#eef0ec] p-4 text-[13px] leading-normal text-[#20201e]">
        {item.text}
      </article>
    )
  }

  if (item.kind === "quote") {
    return (
      <article className="mb-4 block break-inside-avoid rounded-lg bg-[#fafaf8] p-4 text-[13px] font-semibold leading-normal text-[#20201e]">
        “{item.text}”
      </article>
    )
  }

  if (item.kind === "web") {
    return (
      <article className="mb-4 block break-inside-avoid overflow-hidden rounded-lg border border-[#f0eeea] bg-white text-[#20201e]">
        <span className="grid min-h-24 place-items-end justify-start bg-[linear-gradient(135deg,#d9e5ef,#eee7d7)] p-3" />
        <div className="grid gap-1 px-3 py-2.5">
          <strong className="text-[11px]">{item.title}</strong>
          <small className="text-[10px] text-[#a09b94]">{item.source}</small>
        </div>
      </article>
    )
  }

  return (
    <article
      className={`mb-4 grid min-h-[124px] break-inside-avoid place-items-end justify-start rounded-lg p-3 text-xs font-bold text-[#20201e]/80 ${imageToneClass[item.tone]}`}
    >
      <span>{item.label}</span>
    </article>
  )
}
