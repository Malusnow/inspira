export type FeatureVisualKind = "page" | "quote" | "image"

export interface LandingFeature {
  tag: string
  title: string
  description: string
  visual: FeatureVisualKind
  reverse?: boolean
}

export type MasonryPreviewItem =
  | { kind: "image"; tone: "sky" | "green" | "rose" | "amber" | "violet"; label: string }
  | { kind: "note"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "web"; title: string; source: string }

export const landingFeatures: LandingFeature[] = [
  {
    tag: "SAVE PAGE",
    title: "一键保存网页",
    description:
      "点击浏览器插件图标，当前网页立即保存到 Inspira。标题、封面和来源网址自动提取，不需要手动整理。",
    visual: "page"
  },
  {
    tag: "SAVE QUOTE",
    title: "留下打动你的句子",
    description:
      "选中文字后右键，直接保存为 Quote。来源网址自动记录，让每一次引用都有迹可循。",
    visual: "quote",
    reverse: true
  },
  {
    tag: "SAVE IMAGE",
    title: "保存正在看的图片",
    description:
      "右键图片选择 Add to Inspira，在不打断当前浏览过程的情况下，将喜欢的视觉素材收入私人灵感库。",
    visual: "image"
  }
]

export const masonryItems: MasonryPreviewItem[] = [
  { kind: "image", tone: "sky", label: "色彩研究" },
  { kind: "note", text: "下周产品评审准备事项：\n1. 用户调研数据\n2. 竞品分析" },
  { kind: "web", title: "2026 UI 设计趋势", source: "refactoringui.com" },
  { kind: "image", tone: "green", label: "空间灵感" },
  { kind: "quote", text: "设计不是装饰，而是解决问题的方式。" },
  { kind: "image", tone: "rose", label: "摄影构图" },
  { kind: "image", tone: "amber", label: "视觉素材" },
  { kind: "note", text: "颜色不是视觉的附属品，它是信息本身。" },
  { kind: "image", tone: "violet", label: "材质细节" },
  { kind: "web", title: "React 19 完全指南", source: "react.dev" }
]

export const heatCellLevels = [
  "bg-brand",
  "bg-[#d4d0ff]",
  "bg-[#f0eeea]",
  "bg-[#a9a1ff]",
  "bg-[#f0eeea]",
  "bg-[#f0eeea]",
  "bg-brand-soft",
  "bg-brand",
  "bg-[#f0eeea]",
  "bg-[#d4d0ff]",
  "bg-[#a9a1ff]",
  "bg-[#f0eeea]",
  "bg-brand-soft",
  "bg-[#f0eeea]",
  "bg-brand",
  "bg-[#f0eeea]",
  "bg-[#d4d0ff]",
  "bg-[#f0eeea]",
  "bg-brand-soft",
  "bg-[#a9a1ff]"
]
