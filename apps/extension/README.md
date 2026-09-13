# Inspira 插件（Chrome MV3）

把正在浏览的网页、图片和选中文字保存进 Inspira 的 Chrome 扩展。

技术栈：Plasmo + React 18 + TypeScript + Chrome MV3，登录用 `@clerk/chrome-extension`，数据走 Convex。**采集闭环代码已实现，等待真实 Clerk + Convex 环境的人工验收（见「待确认与待验证」）。**

## 范围

本阶段做：

- 点击工具栏图标保存当前页面
- 右键保存选中文字（quote）
- 右键保存图片（image）
- 保存成功后补充 tags / notes
- 未登录、失败、受限来源的诚实反馈

本阶段不做：媒体上传与图片转存（S7）、视频、工作区选择与整理、搜索、内容去重提示、深色主题、Firefox/Safari、AI 字段。

## 现状

| 项          | 状态                                                           |
| ----------- | -------------------------------------------------------------- |
| `popup.tsx` | 五态 UI 编排与配置；展示组件在同级 `components/`               |
| Background  | `background.ts` 实现右键菜单与采集编排，无常驻内容脚本         |
| 消息协议    | 已定义（见 `docs/CONTRACTS.md`）                               |
| 登录        | Clerk 扩展 SDK 已接入；在 Web 应用登录后同步会话（D05）        |
| 数据访问    | Convex 客户端已接入（`lib/backend.ts`）                        |
| 采集契约    | `packages/contracts` 已落地采集类型、字段与错误码              |
| 权限        | 只申请采集与登录必需项；两个 host 来自构建环境变量，无全量域名 |
| 人工验收    | 未执行（T01/T02/T03 与 6.2 冒烟均待真实环境）                  |

## 分层职责

| 层             | 职责                                                            | 约束                                          |
| -------------- | --------------------------------------------------------------- | --------------------------------------------- |
| Popup          | 呈现状态、补充 tags / notes                                     | 生命周期短，不承担编排，不直接调用后端        |
| Service Worker | 右键菜单、采集编排、`clientRequestId` 生成、保存                | 可随时被终止，跨重启状态不能只放内存          |
| Content Script | 只读页面 title / og:image / description                         | 按需注入，非常驻；quote 与 image 不需要读页面 |
| 浏览器适配层   | 封装 `chrome.storage` / `contextMenus` / `scripting` 与消息收发 | 业务代码不直接调用 chrome API，便于 mock      |

编排放在 Service Worker 的原因：popup 在用户点击页面其它位置时会关闭，在 popup 内发起保存会被打断。

登录不在 popup 内完成：登录链接打开 Web 应用，popup 与 Service Worker 都通过 Clerk 的 `syncHost` 读取登录主机上的会话 cookie。

## 采集流程

| 入口         | kind    | 数据来源                                                   |
| ------------ | ------- | ---------------------------------------------------------- |
| 点击图标     | `page`  | 按需注入读取 title / og:image / description + 当前 URL     |
| 右键选中文字 | `quote` | `chrome.contextMenus` 的 `info.selectionText` + 来源页 URL |
| 右键图片     | `image` | `info.srcUrl` + 来源页 URL                                 |

三类共用同一个 capture Mutation 和同一套补充 UI，popup 不显示来源类型标题，也不显示缩略图。右键菜单文案统一为 `Add to Inspira`，由右键上下文区分选文与图片。

## 契约与错误

字段、错误码和幂等语义以 [Contracts](../../docs/CONTRACTS.md) 为准。要点：

- 一个主动操作生成一个 `clientRequestId`；同一次操作的传输重试复用该 ID；用户再次保存是新的 ID。
- 成功结果 `{ inspirationId, created }`。`created=false` 只表示重试命中既有结果，**不表示内容已存在**。
- 主动重复保存创建新内容，不做去重提示。

错误码到界面的映射：

| 错误                    | Popup 表现                       |
| ----------------------- | -------------------------------- |
| `UNAUTHENTICATED`       | 未登录态，给登录链接             |
| `INVALID_INPUT`         | 失败态，不自动重试               |
| `WORKSPACE_UNAVAILABLE` | 失败态，不泄露其他账户信息       |
| `SOURCE_UNAVAILABLE`    | 失败态，不外链降级               |
| `REQUEST_CONFLICT`      | 失败态，不重试，需修正客户端逻辑 |
| `TEMPORARY_FAILURE`     | 失败态，可用同一 ID 重试         |

## 界面

视觉与结构基准：[Plugin 原型](../../docs/design/prototypes/inspira-plugin.html)。

- 固定 384px 宽（≈1920 宽屏的 1/5），锚定工具栏图标下方、屏幕右上角。**不要用 `vw`**：popup 中的 `vw` 相对 popup 自身视口，`20vw` 会塌缩到接近 0。
- 品牌标记为紫色渐变圆角菱形（`#8B7EF7 → #6C63FF`）；正文 `#20201E`、次级 `#777570`、placeholder `#A09B94`、分隔线 `#EDECE8`；tag chip 用灰白（`#F4F3F0` / `#737169`），紫色只留给品牌标记与链接。
- 品牌标记按原型分三态：渐变实心（保存成功）、描边加圆点（未登录）、描边加叉（无法保存）；token 位置见 `components/theme.ts`。
- tag 输入是单行 chip + 输入框同排，右侧自适应；备注单独一行。

五态：

| 状态     | 标题               | 内容                           | 操作               |
| -------- | ------------------ | ------------------------------ | ------------------ |
| 保存中   | —                  | spinner + 「正在保存…」        | 无输入控件         |
| 保存成功 | 已保存到 Inspira   | tag 单行输入 + 备注            | 在 Inspira 中查看  |
| 已填写   | 已保存到 Inspira   | 同上，回显已填 tags / notes    | 在 Inspira 中查看  |
| 未登录   | 无法保存到 Inspira | 「请先登录，再重新保存这一条」 | 登录链接 → landing |
| 无法保存 | 无法保存到 Inspira | 受限页面或网络不可用           | 重试               |

未登录与无法保存共用同一个消息组件，只有文案与操作不同。受限页面（`chrome://`、受保护图片等）一律走失败态，不伪装成功。

## 权限

目标是只申请实际用到的权限。当前 `manifest` 声明与用途：

| 权限                                                 | 对应的流程                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `contextMenus`                                       | 右键 `Add to Inspira` 保存选中文字 / 图片                    |
| `storage`                                            | 用 `chrome.storage.session` 跨 Worker 重启保留待反馈结果     |
| `activeTab`                                          | 用户点击图标 / 右键后临时授权，读取当前页 URL 并注入读取脚本 |
| `scripting`                                          | 点击时按需注入读取 title / og:image / description            |
| `cookies`                                            | Clerk 从登录主机读取会话 cookie（D05 的会话同步）            |
| `host_permissions: $PLASMO_PUBLIC_CLERK_SYNC_HOST/*` | 登录 cookie 所在主机，开发展开为 `http://localhost/*`        |
| `host_permissions: $CLERK_FRONTEND_API/*`            | Clerk Frontend API，扩展直接向它发请求                       |

- 不预先申请 `tabs`，也不使用 `<all_urls>` / `https://*/*`：页面读取只依赖 `activeTab` 的临时授权。
- 两个 host 都来自构建环境变量，不把域名写死在 `package.json`；生产同步域名随 D10 一起填进 `.env.production`。
- 不加载远程托管代码，不把原型的 CDN 脚本复制进插件。

## 目录结构

```text
apps/extension/
  popup.tsx        # 入口：配置、五态编排；登录态由 Worker 查询
  background.ts    # Service Worker：右键菜单 + 采集编排
  components/      # 展示层：theme token、外壳与品牌标记、消息态、补充框
  lib/             # 适配与接入：browser / config / backend / capture / messages / popup-view
  assets/
```

`components/` 只放展示，`lib/` 只放非展示逻辑；`popup.tsx` 不再承载样式细节，避免单文件混装五种状态。

## 配置

插件不读仓库里的任何真实值，全部在构建期从环境变量注入。Plasmo 会把它们内联进代码并插进 `manifest`，所以改完必须重新构建或重启 dev。变量模板见 [`.env.example`](./.env.example)。

### 1. Clerk 实例（一次性）

1. Dashboard → Native applications 启用 Native API。浏览器扩展集成依赖它；它同时打开了一条绕过浏览器 CAPTCHA 的请求通道，需要评估对 bot protection 的影响。
2. Dashboard → API keys，Quick Copy 选 Chrome Extension，取 publishable key 与 Frontend API 地址。Web 应用与插件必须用同一个实例。
3. 把扩展来源加入实例白名单。Clerk 对扩展来源有严格限制，缺这一步扩展向 Frontend API 的请求会被 CORS 拒绝（development 与 production 实例都要设置）：

   ```bash
   # 先读回现有值，避免 PATCH 覆盖掉其他合法来源
   curl https://api.clerk.com/v1/instance -H "Authorization: Bearer $CLERK_SECRET_KEY"

   curl -X PATCH https://api.clerk.com/v1/instance \
     -H "Content-type: application/json" \
     -H "Authorization: Bearer $CLERK_SECRET_KEY" \
     -d '{"allowed_origins": ["chrome-extension://<扩展 ID>"]}'
   ```

   扩展 ID 在 `chrome://extensions` 可见。未打包扩展的 ID 由加载路径决定，换目录就会变；发布前按 Clerk 的 consistent CRX ID 指南固定 `manifest.key`。

4. Dashboard → JWT Templates 建一个名为 `convex` 的模板，`lib/backend.ts` 用它换 Convex 令牌。

### 2. Web 应用：`apps/web/.env.local`

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
VITE_CONVEX_URL=https://placeholder.convex.cloud
```

### 3. Convex 后端

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<slug>.clerk.accounts.dev
```

### 4. 扩展：`apps/extension/.env.development`

`plasmo dev` 读 `.env.development`，`plasmo build` 读 `.env.production`。两者都要有各自的真实值。

| 变量                                  | 说明                                                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY` | 与 Web 同一个 Clerk 实例的 publishable key，缺失时 popup 显示「插件尚未配置」                                   |
| `CLERK_FRONTEND_API`                  | 同一实例的 Frontend API 地址，会被插进 `manifest` 的 `host_permissions`                                         |
| `PLASMO_PUBLIC_CLERK_SYNC_HOST`       | 登录 cookie 所在主机：开发填 `http://localhost`，生产填 Frontend API 主机；同时决定 `host_permissions`          |
| `PLASMO_PUBLIC_CONVEX_URL`            | 与 Web 同一个 Convex deployment                                                                                 |
| `PLASMO_PUBLIC_LANDING_URL`           | Web 应用地址，默认 `https://inspira.app`；本地填 `http://localhost:5173`，只用于登录链接与「在 Inspira 中查看」 |

两个容易踩的点：

- **变量缺失时 `$VAR` 不会被展开**，产物 `manifest` 会留下字面量 `$PLASMO_PUBLIC_CLERK_SYNC_HOST/*`，Chrome 会拒绝加载这种无效的 match pattern。先配好 env，再构建、再加载。构建日志里的 `Loaded environment variables from: [ '.env.production' ]` 可以确认读到了哪个文件。
- `PLASMO_PUBLIC_CLERK_SYNC_HOST` 在开发下是 `http://localhost`，不是 `http://localhost:5173`：Clerk 的 dev cookie 落在 `localhost` 域上，cookie 本身不区分端口，而 manifest 展开出的 `http://localhost/*` 覆盖该主机的所有端口。

这些值都可进入客户端，不是服务端密钥；仓库只保留 `.env.example` 里的占位值，真实值由 `.gitignore` 拦在本地。`cookies` 权限只在扩展本地读取登录主机的 Clerk 会话 cookie。

## 开发

| 用途 | 命令                                                     |
| ---- | -------------------------------------------------------- |
| 开发 | `pnpm --filter apps-extension dev`                       |
| 构建 | `pnpm --filter apps-extension build`                     |
| 打包 | `pnpm --filter apps-extension package`（不代表商店发布） |

开发构建产物在 `build/chrome-mv3-dev`，用 Chrome 的「加载已解压的扩展程序」载入。

## 验证

代码变更完成至少运行 `pnpm --filter apps-extension build`。构建通过不代表业务验收。

人工冒烟（加载未打包扩展）：

- 先确认 `build/chrome-mv3-*/manifest.json` 里的 `host_permissions` 已展开成真实域名
- 登录 / 退出 / 会话过期：先确认 Web 应用已在 `PLASMO_PUBLIC_LANDING_URL` 上登录，再打开 popup
- 点击保存网页、右键划词、右键图片
- 同一请求重试只生成一条；主动保存两次生成两条
- Service Worker 重启后仍能正确反馈
- 未登录态、失败态、受限页面不伪装成功
- 保存后在 Web 端能看到同一条内容及其 tags / notes

已知环境依赖：`chrome.action.openPopup()` 需要 Chrome 127+，更低版本右键结果退化为角标（`...` / `!`），需再点一次图标查看。

未执行的项要明确标注为未执行。

## 待确认与待验证

| 项  | 内容                                                                                                          | 影响             |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------- |
| D05 | 已定登录方式：在 Web 应用登录，扩展用 `syncHost` 同步会话；是否自动恢复待保存请求仍未定，当前需要用户重新保存 | 未登录流程       |
| T01 | Service Worker 内能否获取 Clerk token 并调用 Convex                                                           | 登录与保存链路   |
| T02 | 同请求重试、主动再次保存、Worker 重启                                                                         | 幂等与状态持久化 |
| T03 | 普通 / 受保护 / blob / data / 内网页面的图片采集                                                              | 权限与受限来源   |

未定项只在其阻塞当前任务时才需要推动确认，不自行实现「登录后自动恢复草稿」这类未确认行为。

## 相关文档

- 契约：[docs/CONTRACTS.md](../../docs/CONTRACTS.md)
- 架构与待验证项：[docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- 开发命令与验收：[docs/DEVELOPMENT.md](../../docs/DEVELOPMENT.md)
- 产品决策与实现顺序：[docs/PRODUCT.md](../../docs/PRODUCT.md)
- 界面原型：[docs/design/README.md](../../docs/design/README.md)
- 采集变更规格：`openspec/changes/implement-extension-capture/`
