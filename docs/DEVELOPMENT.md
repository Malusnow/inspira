# Inspira Development

> 状态：开发入口和验证入口。

## 工作区

仓库是 pnpm monorepo：

| 路径                 | 作用                                                           |
| -------------------- | -------------------------------------------------------------- |
| `apps/web`           | React / TypeScript / Vite / TDesign / Clerk / Convex / ECharts / Tailwind |
| `apps/extension`     | Plasmo / React / TypeScript / Chrome MV3 / Clerk Extension SDK |
| `packages/contracts` | Web、插件、后端共享类型与校验                                  |
| `convex`             | Convex 后端最小 S1 Note Schema、鉴权配置和函数                 |

安装依赖：

```bash
pnpm install --frozen-lockfile
```

## 当前命令

| 用途     | 命令                                   | 当前限制                                                 |
| -------- | -------------------------------------- | -------------------------------------------------------- |
| Web 开发 | `pnpm --filter web dev`                | 需要 Web Clerk/Convex 环境变量才可使用登录后的 Note 流程 |
| Web lint | `pnpm --filter web lint`               | 当前可用                                                 |
| Web 构建 | `pnpm --filter web build`              | 当前可用，但不代表业务验收                               |
| Web 预览 | `pnpm --filter web preview`            | 需先构建                                                 |
| 插件开发 | `pnpm --filter apps-extension dev`     | 当前可用，业务采集未接通                                 |
| 插件构建 | `pnpm --filter apps-extension build`   | 当前可用                                                 |
| 插件打包 | `pnpm --filter apps-extension package` | 不代表商店发布                                           |

尚未接通：根 `pnpm typecheck`、根 `pnpm build`、有效 `pnpm test`、contracts 测试、CI、Playwright、Convex 后端验证脚本。

## 验证规则

代码变更完成前运行覆盖改动范围的真实检查：

- Web：至少运行 `pnpm --filter web lint` 和 `pnpm --filter web build`，除非本次只改无关文档。
- 插件：至少运行 `pnpm --filter apps-extension build`。
- contracts 或共享逻辑：S0 接通后运行根 typecheck/test；接通前要明确报告缺口。
- 纯文档：检查链接、引用、状态和职责是否一致，不跑无关应用测试。

不能把文档审阅、OpenSpec 校验、空测试或未运行 CI 写成业务通过。

## 人工验收

核心流程完成后再做对应人工验证：

| 范围        | 验证                                                                |
| ----------- | ------------------------------------------------------------------- |
| Identity    | 两个测试账户互不能读写内容、工作区、标签聚合和媒体                  |
| Library     | 创建、编辑、详情、删除确认、空/错/加载状态                          |
| Extension   | 点击保存网页、右键图片、右键划词、未登录反馈、Worker 重启、Web 同步 |
| Media       | 允许文件上传、超限拒绝、取消/失败、短时地址、跨用户拒绝、视频播放   |
| Search      | 标题/正文/标签命中、无结果、分页或筛选边界                          |
| Insights    | 固定测试数据下统计口径正确，无收藏统计                              |
| Serendipity | 频度影响字号、颜色和中心位置；长标签、小屏、键盘可用                |
| Theme       | TDesign、ECharts 和自定义界面主题一致                               |

## 环境配置

| 信息                                  | 建议位置                  | 说明                         |
| ------------------------------------- | ------------------------- | ---------------------------- |
| Web Clerk publishable key、Convex URL | `apps/web` 环境变量       | 可进入客户端，不是服务端密钥 |
| 插件 Clerk publishable key、后端 URL  | `apps/extension` 构建环境 | 可进入客户端，不放秘密       |
| Convex 部署和 Clerk issuer/audience   | 后端部署环境              | 地址与部署凭证分开           |
| 存储密钥、视频服务凭证                | 后端秘密环境              | 不能进入 Vite/Plasmo 或仓库  |
| 生产域名、CRX ID、隐私地址            | 发布配置                  | D05/D10/T01 完成后确定       |

.env 示例只能放安全占位值。不要提交 Token、真实用户内容、完整私密网页数据或存储密钥。

Web S1 Note 本地运行需要：

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
VITE_CONVEX_URL=https://placeholder.convex.cloud
```

Convex Clerk 验证需要在后端环境设置：

```bash
CLERK_JWT_ISSUER_DOMAIN=https://placeholder.clerk.accounts.dev
```

这些值必须替换为本地/测试项目的真实配置后才能做 A/B 账户人工验收；真实值不得提交。

## OpenSpec

- `openspec list --json` 查看当前 change。
- `openspec status --change <name> --json` 查看规划产物状态。
- `openspec instructions apply --change <name> --json` 查看执行指令和任务。
- `openspec validate <name> --strict` 校验规格结构。

OpenSpec 用来管理一次变更的范围、任务和验收。长期事实同步到 `docs/` 后，完成的 change 再归档。
