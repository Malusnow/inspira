# apps/web 代码组织与规范

## 1. 目录职责与改动归属

```
apps/web/src/
  app/        # 应用骨架：路由表（react-router）、全局布局、整体 Provider 装配
  assets/     # 图片、SVG、字体等静态资源（不是 CSS）
  components/ # 无业务语义、可跨模块复用的展示组件；只依赖 TDesign/Tailwind/自身样式，不 import features/*
  features/   # 按产品模块垂直组织（目录一一对应产品模块）
                all/          全部内容卡片流、详情浮层、视图切换
                notes/        Web Note 写作层、基础创建体验
                workspaces/   工作区总览与单区专题流
                insights/     统计（ECharts）、趋势（依 PRODUCT/Insights）
                landing/      产品介绍页与采集演示
                preferences/  主题偏好 Provider 与 context
                settings/     主题/主色/默认视图/账户与插件状态
  hooks/      # 跨模块复用的自定义 hooks（弹层关闭、视口定位、响应式列数等 UI 行为）
  lib/        # 纯函数与常量：Convex id 判定、布局计算、主题算法（无 JSX）
  styles/     # 全局与主题：index.css 入口、Tailwind import、语义 Token、reset、跨页共享样式
```

哪些改动进哪里：

| 改动对象                                   | 位置                                        |
| ------------------------------------------ | ------------------------------------------- |
| 路由、Layout、全局 Provider 装配           | `src/app/`                                |
| 通用可复用小组件（标题、卡片骨架、图标位） | `src/components/`                         |
| 某产品模块的页面/表单/卡片及其状态         | `src/features/<模块>/`                    |
| 在两个以上模块复用的查询/逻辑 hook         | `src/hooks/`                              |
| 纯逻辑、格式函数、常量                     | `src/lib/`                                |
| 全局样式、Tailwind import、Token、reset    | `src/styles/`                             |
| 图片/SVG/字体                              | `src/assets/`                             |
| 内容分片数据契约、跨端校验                 | `packages/contracts`（参考 ARCHITECTURE） |

## 2. 组件化与低耦合

- **模块内聚、模块间解耦**：一个 product 模块的内部子组件、就近 hooks、样式都放 `features/<模块>/` 里；模块之间不要互相 import 内部实现，只经共享层。
- 共享层顺序克制：模块 → `hooks`/`lib` → `components` → `app`。`components` 不 import `features/*`；`lib` 不放业务组件。
- 一个组件/文件做一件事；过大先拆子组件或用组合。
- 状态尽量就近；状态要透传多层（约 2 层以上）或跨模块时，改用组合/依赖注入或适度 context。
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
- 逻辑谓词用 `is` 前缀表达布尔。

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
