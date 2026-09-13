# Inspira

Inspira 是一个私人灵感收集与再发现工具，用于保存 Note、网页、图片、选中文字和视频，并通过 All、Workspaces、Tags、Search 和 Insights 找回自己的内容。

## 技术栈

- Monorepo：pnpm workspace
- Web：React、TypeScript、Vite、TDesign、Clerk、Convex、ECharts、Tailwind CSS
- Extension：Plasmo、React、TypeScript、Chrome MV3、Clerk Extension SDK
- Backend：Convex
- Shared：`packages/contracts` 存放共享类型、校验和消息契约

## 目录

| 路径                 | 说明                              |
| -------------------- | --------------------------------- |
| `apps/web`           | Web 应用                          |
| `apps/extension`     | Chrome 插件                       |
| `convex`             | Convex schema、鉴权配置和后端函数 |
| `packages/contracts` | Web、插件、后端共享契约           |
| `docs`               | 产品、架构、接口、开发和设计文档  |

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

## Landing 页面说明

Landing 页面上与插件发布相关的入口目前都是模板按钮，**仅用于呈现 UI 效果，并未发布也不知道发布地址**，点击不会有任何反应：

| 位置    | 元素                   | 当前行为                                |
| ------- | ---------------------- | --------------------------------------- |
| 导航栏  | 「获取浏览器插件」按钮 | 占位按钮（`type="button"`），点击无反应 |
| 导航栏  | 「浏览器插件」         | 静态文字标签（`<span>`），不可点击      |
| Hero 区 | 「获取浏览器插件」按钮 | 占位按钮（`type="button"`），点击无反应 |

- 插件未发布，页面不展示未确认的下载地址，与 `docs/PRODUCT.md` 中 Landing 的约束一致。
- 导航栏的「登录」由 Clerk `SignInButton` 驱动，是真实功能，不属于模板按钮。
- Landing 页面正文止于「你的灵感，只属于你。」区块；演示视频、插件下载和页脚区块已移除。
- 拿到正式发布地址后，把上述模板按钮替换为真实链接，并同步删掉本节说明。

## 使用说明：Chrome 插件

### 浏览器与版本

| 项         | 要求                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| 浏览器     | Google Chrome（Manifest V3）。不支持 Firefox 和 Safari，Edge 等 Chromium 浏览器未验证                               |
| 浏览器版本 | Chrome 127 或更高。低于 127 时 `chrome.action.openPopup()` 不可用，右键保存的结果退化为图标角标，需再点一次图标查看 |
| 插件版本   | `0.1.0`（取 `apps/extension/package.json` 的 `version`，构建时会写进 manifest）                                     |
| 安装方式   | 未上架 Chrome 应用商店，只能手动加载「未打包扩展」                                                                  |

### 安装步骤

1. 安装依赖：`pnpm install --frozen-lockfile`
2. 复制 `apps/extension/.env.example` 为 `apps/extension/.env.local` 并填入真实值（Clerk publishable key、Frontend API 地址、Convex URL、同步主机、Web 应用地址）。**变量缺失时 manifest 里的 `$VAR` 不会展开，Chrome 会直接拒绝加载**；细节见 [插件配置](apps/extension/README.md#配置)。
3. 构建插件：

   | 场景     | 命令                                 | 产物目录                               |
   | -------- | ------------------------------------ | -------------------------------------- |
   | 日常使用 | `pnpm --filter apps-extension build` | `apps/extension/build/chrome-mv3-prod` |
   | 开发调试 | `pnpm --filter apps-extension dev`   | `apps/extension/build/chrome-mv3-dev`  |

4. 打开 Chrome，地址栏输入 `chrome://extensions`
5. 打开右上角「开发者模式」
6. 点「加载已解压的扩展程序」，选择上表中的产物目录（选到含 `manifest.json` 的那一层，不要选 `build` 或 `dist`）
7. 确认出现名为 `Inspira` 的卡片且没有报错

重新构建后，回到 `chrome://extensions` 点该卡片上的刷新按钮即可生效。

### 使用方法

登录不在插件里完成：先在 Web 应用（`PLASMO_PUBLIC_LANDING_URL` 指向的地址）登录，插件通过 Clerk 的 `syncHost` 同步登录主机的会话 cookie。

| 操作                                       | 保存的内容        |
| ------------------------------------------ | ----------------- |
| 点击工具栏的 Inspira 图标                  | 当前网页（page）  |
| 在页面中选中文字 → 右键 → `Add to Inspira` | 选中文字（quote） |
| 在图片上右键 → `Add to Inspira`            | 图片地址（image） |

保存成功后 popup 会停留在成功态，可以接着补 tags 和备注，点「在 Inspira 中查看」跳回 Web 端查看。未登录、受限页面（`chrome://`、受保护的图片）以及网络失败都会如实提示，不会伪装成保存成功。

插件只申请采集与登录必需的权限（`activeTab`、`contextMenus`、`scripting`、`storage`、`cookies`），不申请 `tabs`，也不使用 `<all_urls>`；页面信息只在用户点击后经临时授权读取。详见 [权限说明](apps/extension/README.md#权限)。

### 打包分发

`pnpm --filter apps-extension package` 会生成 `apps/extension/build/chrome-mv3-prod.zip`，可直接拖入 `chrome://extensions` 安装或用于提交商店；这不代表已发布。

分发前注意：未打包扩展的 ID 由加载目录决定，换目录就会变，ID 变化后要同步更新 Clerk 实例的来源白名单；正式分发需按 Clerk 的 consistent CRX ID 指南固定 `manifest.key`。

## 更多文档

- 产品范围：[docs/PRODUCT.md](docs/PRODUCT.md)
- 架构边界：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 接口契约：[docs/CONTRACTS.md](docs/CONTRACTS.md)
- 开发与验收：[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- 设计说明：[docs/design/README.md](docs/design/README.md)
