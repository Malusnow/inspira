# Inspira 协作入口

## 先读什么

| 任务                 | 阅读                                                 |
| -------------------- | ---------------------------------------------------- |
| 任意任务             | 当前 OpenSpec change、目标目录 `AGENTS.md`、相关源码 |
| 产品行为、模块顺序   | `docs/PRODUCT.md`                                    |
| 架构、后端、数据边界 | `docs/ARCHITECTURE.md`                               |
| 接口、采集、媒体     | `docs/CONTRACTS.md`                                  |
| 启动、检查、验收     | `docs/DEVELOPMENT.md`                                |
| Web UI               | `docs/design/README.md` 和对应原型                   |
| Chrome 插件          | `apps/extension/AGENTS.md`、`docs/CONTRACTS.md`      |

小任务只读相关入口，不扫全量文档。

## 固定边界

- pnpm monorepo：`apps/web`、`apps/extension`、`packages/contracts`，目标后端为 Convex。
- Web 技术栈：React、TypeScript、Vite、TDesign、Clerk、Convex、ECharts、Tailwind CSS。
- 插件技术栈：Plasmo、React、TypeScript、Chrome MV3、Clerk Extension SDK。
- 共享只放数据契约、校验和消息类型；不共享页面组件。
- 不顺带升级技术栈、抽包、多浏览器、AI、协作或复杂富文本。

## 产品硬约束

- 内容类型：page、image、quote、note、video。
- tags 是用户输入的 `string[]`，不是 tagId。
- 一条内容可同时属于多个 workspace（最多 12 个），也可为空；加入新 workspace 不影响已有归属。
- 首次保存不强制整理。
- 主动重复保存创建新内容；同请求重试不能重复创建。
- 删除前确认；确认后直接删除，不提供恢复入口。
- 没有收藏字段、收藏操作、收藏统计或旧内容回顾。

## 安全与契约

- 服务端从验证后的会话确定用户；不信任客户端 `userId`。
- 内容、工作区、标签聚合、统计和媒体都按 owner 隔离。
- 输入必须运行时校验；TypeScript 类型不是安全边界。
- 契约变更同步 `packages/contracts`、调用端、服务端、测试和 `docs/CONTRACTS.md`。
- 不提交密钥、Token、完整用户内容或敏感网页数据。

## OpenSpec

- `propose` 只规划，不改业务代码。
- `apply` 执行已授权 change，按实际证据勾选任务。
- 完成后如实报告验证结果；不自动开启下一个 change，不自动归档。
- 未定产品行为只在阻塞当前任务时询问；无关待定项不阻塞编码。

## 验证

- Web 改动：运行 `pnpm --filter web lint` 和 `pnpm --filter web build`。
- 插件改动：运行 `pnpm --filter apps-extension build`。
- 共享契约/根脚本：按当前 change 接通后的入口运行。
- 当前根 `test/typecheck/build` 尚未全部接通；不能用空测试或空 CI 当通过证据。
- 纯文档改动检查链接、状态和职责一致性即可。
