## Why

Inspira 当前仍是 Web 脚手架，尚未具备登录用户保存和查看私人灵感的最小闭环。S1 需要先交付 Note 核心路径，让后续内容类型、插件、媒体、搜索和统计都能建立在已验证的身份与所有权边界上。

## What Changes

- 接入 Web 端 Clerk 登录状态，并把已登录会话传递给 Convex 客户端；未登录用户不能进入 Note 数据流。
- 建立 Convex 后端最小 Schema 和鉴权辅助，从服务端验证后的会话确定 owner，不接受客户端提交 owner/userId。
- 提供创建 Note 的 Mutation，支持标题、正文、字符串 tags、可选 workspaceId 为空；服务端执行运行时校验。
- 提供 Everything 列表 Query，仅返回当前登录用户自己的 Note，并在创建成功后可见。
- 在 Web Everything 页面替换示例脚手架，提供创建 Note、本人 Note 卡片流、加载/空/错误/成功状态。
- 点击 Note 卡片在当前流上打开详情浮层，展示标题、正文、Tags、创建/更新时间，并可关闭返回列表。
- 验证两个用户数据隔离：用户 A 创建的 Note，用户 B 的列表和详情入口都不可见。

## Capabilities

### New Capabilities

- `note-core`: 登录用户创建 Note、查看本人 Everything 列表、打开详情浮层，以及服务端 owner 隔离的最小业务闭环。

### Modified Capabilities

无。当前没有已归档主规格，本变更新增 S1 业务能力规格。

## Impact

计划影响 `apps/web` 的 React 入口、页面组件、样式和环境变量说明，接入 `@clerk/react`、`convex/react` 与 TDesign 组件；保留当前技术栈，不引入路由外的复杂页面结构。

计划新增仓库根 `convex/` 后端目录，包含最小 Schema、鉴权辅助、Note 创建 Mutation 与 Everything 列表/详情所需 Query。契约变更同步 `packages/contracts`、Web 调用端、后端运行时校验和 `docs/CONTRACTS.md`。

本变更不包含插件、图片/视频上传、工作区管理、搜索、Insights、Serendipity、Page/Image/Quote/Video CRUD、收藏、恢复入口、AI 字段、协作或复杂富文本。验收以 `docs/DEVELOPMENT.md` 当前可用检查和人工 A/B 账户隔离流程为准。
