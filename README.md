# Inspira

Inspira 是一个私人灵感收集与探索工具。首版目标是让用户保存 Note、网页、图片、选中文字和视频，并通过 All、Workspaces、Tags、Search、Insights 和 Explore 找回自己的内容。

## 技术栈

- Monorepo：pnpm workspace
- Web：React、TypeScript、Vite、TDesign、Clerk、Convex、ECharts、Tailwind CSS
- Extension：Plasmo、React、TypeScript、Chrome MV3、Clerk Extension SDK
- Backend：Convex
- Shared：`packages/contracts` 存放共享类型、校验和消息契约

## 目录

| 路径                   | 说明                              |
| ---------------------- | --------------------------------- |
| `apps/web`           | Web 应用                          |
| `apps/extension`     | Chrome 插件                       |
| `convex`             | Convex schema、鉴权配置和后端函数 |
| `packages/contracts` | Web、插件、后端共享契约           |
| `docs`               | 产品、架构、接口、开发和设计文档  |
| `openspec`           | OpenSpec 变更规划与规格           |

## 本地开发

安装依赖：

```bash
pnpm install --frozen-lockfile
```

启动 Web：

```bash
pnpm --filter web dev
```

构建 Web：

```bash
pnpm --filter web build
```

检查 Web：

```bash
pnpm --filter web lint
```

插件命令：

```bash
pnpm --filter apps-extension dev
pnpm --filter apps-extension build
pnpm --filter apps-extension package
```

## 环境变量

Web 本地运行需要：

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
VITE_CONVEX_URL=https://placeholder.convex.cloud
```

Convex 验证 Clerk JWT 需要在后端环境设置：

```bash
CLERK_JWT_ISSUER_DOMAIN=https://placeholder.clerk.accounts.dev
```

不要提交真实 Token、密钥、完整用户内容或敏感网页数据。Clerk secret key 只在服务端主动调用 Clerk Backend API 时需要；当前 Convex 鉴权流程只验证 Clerk JWT，不需要放 secret key。

## 更多文档

- 产品范围：[docs/PRODUCT.md](docs/PRODUCT.md)
- 架构边界：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 接口契约：[docs/CONTRACTS.md](docs/CONTRACTS.md)
- 开发与验收：[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- 设计说明：[docs/design/README.md](docs/design/README.md)
