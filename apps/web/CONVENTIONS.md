# apps/web 代码组织与规范

> 规则落地目标：分层清晰、组件化、低耦合、可预测的命名。`web/AGENTS.md` 负责告诉开发者先读什么、改哪里；本文负责目录归属、命名、依赖方向和 Tailwind/CSS 细则。
> 现状备注：早期演示期单体会按本文档增量拆分到对应目录；新 UI 默认使用 Tailwind 工具类，不新增页面级 CSS 单体。

## 1. 目录职责与改动归属

```
apps/web/src/
  app/        # 应用骨架：入口 App.tsx、路由表（react-router）、全局布局与 Sidebar、整体 Provider 装配
  assets/     # 图片、SVG、字体等静态资源（不是 CSS）
  components/ # 无业务语义、可跨模块复用的展示组件；只依赖 TDesign/Tailwind/自身样式，不 import features/*
  features/   # 按产品模块垂直组织（目录一一对应产品模块）
                all/          全部内容卡片流、详情浮层、视图切换
                notes/        Web Note 写作层、基础创建体验
                workspaces/   工作区总览与单区专题流
                insights/     统计（ECharts）、趋势（依 PRODUCT/Insights）
                explore/      标签词云与点击钻取等再发现体验
                settings/     主题/主色/默认视图/账户与插件状态
  hooks/      # 跨模块复用的自定义 hooks（数据查询、认证护栏、媒体地址申请等）
  lib/        # 纯函数/数据访问层：Convex 客户端 api、格式化、运行时复用、路由辅助（无 JSX 或仅极薄封装）
  styles/     # 全局与主题：index.css 入口、Tailwind import、语义 Token、reset；不放页面级样式
```

哪些改动进哪里：

| 改动对象                                   | 位置                                        |
| ------------------------------------------ | ------------------------------------------- |
| 路由、Layout、全局 Provider 装配           | `src/app/`                                |
| 通用可复用小组件（标题、卡片骨架、图标位） | `src/components/`                         |
| 某产品模块的页面/表单/卡片及其状态         | `src/features/<模块>/`                    |
| 在两个以上模块复用的查询/逻辑 hook         | `src/hooks/`                              |
| 纯逻辑、数据请求封装、格式函数、常量       | `src/lib/`                                |
| 全局样式、Tailwind import、Token、reset    | `src/styles/`                             |
| 图片/SVG/字体                              | `src/assets/`                             |
| 内容分片数据契约、跨端校验                 | `packages/contracts`（参考 ARCHITECTURE） |

示例：新增"卡片视图切换"改动 → 页面逻辑与视图组件入 `features/all`；若其中某个无业务语义的小组件被多个模块复用 → 提炼到 `components/`。

## 2. 组件化与低耦合

- **模块内聚、模块间解耦**：一个 product 模块的内部子组件、就近 hooks、样式都放 `features/<模块>/` 里；模块之间不要互相 import 内部实现，只经共享层。
- 共享层顺序克制：模块 → `hooks`/`lib` → `components` → `app`。`components` 不 import `features/*`；`lib` 不放业务组件。
- 一个组件/文件做一件事；过大先拆子组件或用组合，而不是靠很多 props 开关硬撑。
- 状态尽量就近；状态要透传多层（约 2 层以上）或跨模块时，改用组合/依赖注入或适度 context，避免 prop 深钻到不可维护。
- 展示与副作用分开写更易测试：纯函数进 `lib`，查询副作用收敛到上层组件或 `hooks`。
- props 用明确的职责名 + 类型别名（`XxxProps`）；不要用隐晦的 boolean 堆叠重载语义。

## 3. 命名规范

### 组件与文件

- 组件文件：`PascalCase.tsx`，默认每文件一个组件；默认导出该组件。文件路径区分目录用小写（`lower-kebab-case`）。
- Props 类型：`接口名 = `组件名`Props`（如 `NoteCardProps`），放同文件并 `export type`。
- 有副作用的页面入口组件后缀 `Page`（如 `InsightsPage`）或归到对应模块路由；无业务的小展示组件不放 `Page` 后缀。

### 函数

- 纯函数与工具：`camelCase`，动词起头（`get`/`build`/`format`/`parse`/`normalize`）。
- React 自定义 hook：小写 `use` 前缀（`useNotes`、`useSelectedTags`）。
- 事件回调/处理：以 `handle` 前缀命名（`handleSubmit`、`handleOpen`）。
- 逻辑谓词用 `is` 前缀表达布尔（`isLoading` 用 query 状态返回变量，命名仍清晰）。

### 状态/变量

- 语义化命名，避免单字母或无转折的缩写；状态变量与 setter 成对（`tags`/`setTags`）。
- 常量用 `UPPER_SNAKE` 或 `camelCase` 视常量暴露层级而定——数值归 `lib` 常量集，字面量不散落。

### Tailwind 与 CSS

- 新 UI 默认使用 Tailwind utility class 表达布局、间距、颜色、响应式、状态和常见交互；优先复用 `styles/index.css` 中的语义 token（如 `bg-canvas`、`text-ink`、`text-brand`）和 TDesign 主题变量。
- 多处重复出现的 class 组合可收敛为模块内 `const`、小展示组件或通用组件；不要为了复用少量样式新增页面级 CSS 文件。
- `src/styles/index.css` 只承担 `@import "tailwindcss"`、语义 token、reset、TDesign 变量映射和确属全局的基础规则。
- 仅当 Tailwind 难以清晰表达（复杂关键帧、第三方库深层选择器、浏览器特定补丁等）时才添加 CSS；CSS 应就近放在组件目录，类名用有含义的 `lower-kebab-case` 并加模块前缀，避免污染全局。
- 不在 JSX 中散落与主题无关的大量硬编码色值；若原型值需要复用或进入主题，先映射为语义 token 或局部常量。

## 4. 完整度检查清单（配合 AGENTS）

- 改动涉及新 UI 状态时覆盖 loading / empty / error / success、键盘焦点与基本响应式。
- 所有读取与写入都走本人鉴权查询，客户端隐藏不代替服务端隔离。
- 完成后跑 `pnpm --filter web lint` 与 `pnpm --filter web build`；核心流程补 Playwright 与视口截图。
