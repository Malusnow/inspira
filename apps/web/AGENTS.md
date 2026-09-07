# Web 局部规则

与 [全仓规则](../../AGENTS.md) 一起使用。任意 Web 代码改动先读 [代码组织与规范](CONVENTIONS.md)，目录归属、命名、组件拆分和 Tailwind/CSS 细则以它为准。

## 先读什么

| 任务类型                 | 先读                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- |
| 任意 Web 代码改动        | [CONVENTIONS.md](CONVENTIONS.md)                                                       |
| 产品行为、范围、模块边界 | [Product](../../docs/PRODUCT.md)                                                       |
| UI/页面/视觉实现         | [Design](../../docs/design/README.md) 和对应原型                                       |
| 数据读取、鉴权、媒体边界 | [Architecture](../../docs/ARCHITECTURE.md)、[Contracts](../../docs/CONTRACTS.md)       |
| 启动、检查、验收         | [Development](../../docs/DEVELOPMENT.md)                                               |
| 契约字段或校验变化       | `packages/contracts`、[Contracts](../../docs/CONTRACTS.md)、相关 Convex/Web 调用端     |

## 开发目录

| 改动内容                       | 主要目录/文件                                             |
| ------------------------------ | --------------------------------------------------------- |
| App 入口、Provider、路由、布局  | `src/App.tsx`，后续复杂化后放 `src/app/`                  |
| 产品页面和模块内组件           | `src/features/<module>/`                                  |
| 跨模块展示组件                 | `src/components/`                                         |
| 跨模块 hooks                   | `src/hooks/`                                              |
| 纯函数、格式化、客户端封装     | `src/lib/`                                                |
| 图片、SVG、字体等静态资产      | `src/assets/`                                             |
| Tailwind import、语义 token、reset | `src/styles/index.css`                                    |

更细的拆分、命名、依赖方向和 Tailwind/CSS 规则见 [CONVENTIONS.md](CONVENTIONS.md)。

## 执行规则

- 页面覆盖适用 loading/empty/error/success、键盘焦点和基本响应式。详情浮层按产品已确认布局实现，小屏与非媒体类型在对应 change 明确。
- TDesign 承担正式交互组件，ECharts 承担统计；主题同时作用于两者，原型颜色只是有状态参考，不散布硬编码色替代主题映射。
- Tailwind 已进入技术栈（v4，依赖已装）；接线 `@tailwindcss/vite` 插件、在 `styles/index.css` 里 `@import "tailwindcss"` 之前不要在 JSX 用工具类，避免样式中途失效。
- 所有数据来自本人鉴权查询；客户端隐藏 UI 不能代替服务端隔离。媒体短时地址按后端授权获取，不在浏览器持有存储秘密。
- 完成代码变化运行 `pnpm --filter web lint`、`pnpm --filter web build`；其他检查见 [Development](../../docs/DEVELOPMENT.md)。
- 核心流程完成后补 Playwright 主流程和固定视口截图；未执行要说明。
