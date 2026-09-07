import type { FeatureVisualKind } from "./landingData"
import { landingFeatures } from "./landingData"
import { eyebrowClass, sectionClass } from "./landingStyles"

export function LandingFeatures() {
  return (
    <section className={sectionClass} id="features">
      {landingFeatures.map((feature) => (
        <FeatureRow
          description={feature.description}
          key={feature.title}
          reverse={feature.reverse}
          tag={feature.tag}
          title={feature.title}
          visual={feature.visual}
        />
      ))}
    </section>
  )
}

function FeatureRow({
  tag,
  title,
  description,
  visual,
  reverse = false
}: {
  tag: string
  title: string
  description: string
  visual: FeatureVisualKind
  reverse?: boolean
}) {
  return (
    <article
      className={`mb-14 grid grid-cols-1 items-center gap-6 last:mb-0 md:mb-20 md:grid-cols-2 md:gap-[60px] ${
        reverse ? "md:[direction:rtl]" : ""
      }`}
    >
      <div className={reverse ? "md:[direction:ltr]" : ""}>
        <p className={eyebrowClass}>{tag}</p>
        <h3 className="mb-3.5 mt-3 text-[28px] font-bold leading-tight text-[#20201e]">
          {title}
        </h3>
        <p className="m-0 text-[15px] leading-[1.65] text-[#777570]">{description}</p>
      </div>
      <div
        className={`min-h-[260px] rounded-lg border border-[#f0eeea] bg-white p-6 shadow-[0_4px_24px_rgba(32,32,30,0.04)] ${
          reverse ? "md:[direction:ltr]" : ""
        }`}
      >
        <FeatureVisual visual={visual} />
      </div>
    </article>
  )
}

function FeatureVisual({ visual }: { visual: FeatureVisualKind }) {
  if (visual === "quote") {
    return (
      <div className="grid min-h-[212px] content-center gap-3 rounded-lg bg-[#fafaf8] p-8">
        <span className="text-[11px] text-[#a09b94]">Selected quote</span>
        <strong className="text-xl text-[#20201e]">“每一次引用都有迹可循。”</strong>
        <small className="text-[11px] text-[#a09b94]">source.example</small>
      </div>
    )
  }

  if (visual === "image") {
    return (
      <div className="grid min-h-[212px] grid-cols-[1fr_0.75fr] grid-rows-2 gap-3 rounded-lg">
        <span className="row-span-2 rounded-lg bg-[linear-gradient(145deg,rgba(81,125,107,0.45),rgba(214,126,92,0.26)),#d9dfdc]" />
        <span className="rounded-lg bg-[#e7d6c6]" />
        <span className="rounded-lg bg-[#d9d7ec]" />
      </div>
    )
  }

  return (
    <div className="grid min-h-[212px] content-end gap-2 rounded-lg bg-[linear-gradient(145deg,rgba(42,92,148,0.18),rgba(108,99,255,0.14)),#eef3f5] p-6">
      <span className="h-[88px] w-[70%] rounded-lg bg-white/60" />
      <strong className="text-xl text-[#20201e]">Interface notes</strong>
      <p className="max-w-[250px] text-[#777570]">
        Color, rhythm, layout and tiny product decisions.
      </p>
    </div>
  )
}
