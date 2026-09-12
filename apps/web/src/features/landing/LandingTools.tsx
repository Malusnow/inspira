import { ChartBarIcon, ComponentGridIcon } from "tdesign-icons-react"
import type { ReactNode } from "react"

import { heatCellLevels } from "./landingData"
import { sectionClass, sectionTitleClass } from "./landingStyles"

export function LandingTools() {
  return (
    <section className={sectionClass}>
      <h2 className={`${sectionTitleClass} mb-12`}>整理与回顾</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ToolCard
          icon={<ComponentGridIcon className="h-5 w-5" />}
          title="Workspace"
          description="为重要的主题，留一个空间。每个工作区有独立的卡片流和代表色，让你的灵感井井有条。"
        >
          <div className="flex flex-col gap-2 rounded-lg bg-[#f7f6f2] p-5 sm:flex-row">
            <PreviewWorkspace title="产品设计" count="128 条灵感" tone="brand" />
            <PreviewWorkspace title="摄影灵感" count="86 条灵感" tone="warm" />
          </div>
        </ToolCard>
        <ToolCard
          icon={<ChartBarIcon className="h-5 w-5" />}
          title="Insights"
          description="看看灵感如何慢慢积累。365 天热力图、内容类型构成和趋势，帮你重新发现过去的灵感。"
        >
          <div className="rounded-lg bg-[#f7f6f2] p-5">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row">
              <PreviewStat value="128" label="灵感总数" />
              <PreviewStat value="28" label="活跃天数" />
              <PreviewStat value="12" label="本周新增" />
            </div>
            <div
              className="grid grid-cols-10 gap-0.5 sm:grid-cols-[repeat(20,minmax(0,1fr))]"
              aria-hidden="true"
            >
              {heatCellLevels.map((level, index) => (
                <span className={`aspect-square rounded-[2px] ${level}`} key={index} />
              ))}
            </div>
          </div>
        </ToolCard>
      </div>
    </section>
  )
}

function ToolCard({
  icon,
  title,
  description,
  children
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <article className="rounded-lg border border-[#f0eeea] bg-white p-6 shadow-[0_4px_24px_rgba(32,32,30,0.03)] sm:p-9">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand-ink">
          {icon}
        </span>
        <h3 className="m-0 text-xl font-bold text-[#20201e]">{title}</h3>
      </div>
      <p className="mb-6 text-sm leading-[1.6] text-[#777570]">{description}</p>
      {children}
    </article>
  )
}

function PreviewWorkspace({
  title,
  count,
  tone
}: {
  title: string
  count: string
  tone: "brand" | "warm"
}) {
  return (
    <div
      className={`grid flex-1 gap-1 rounded-lg bg-white p-3 ${
        tone === "brand" ? "border-l-[3px] border-l-brand" : "border-l-[3px] border-l-[#e87a3d]"
      }`}
    >
      <strong className="text-xs text-[#20201e]">{title}</strong>
      <span className="text-[11px] text-[#a09b94]">{count}</span>
    </div>
  )
}

function PreviewStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="grid gap-1">
      <strong className="text-xl text-[#20201e]">{value}</strong>
      <span className="text-[11px] text-[#a09b94]">{label}</span>
    </div>
  )
}
