# Inspira 插件（Chrome MV3）

把正在浏览的网页、图片和选中文字保存进 Inspira 的 Chrome 扩展。

技术栈：Plasmo + React 18 + TypeScript + Chrome MV3，登录用 `@clerk/chrome-extension`，数据走 Convex。**采集闭环尚未实现，当前是脚手架状态。**

## 范围

本阶段做：

- 点击工具栏图标保存当前页面
- 右键保存选中文字（quote）
- 右键保存图片（image）
- 保存成功后补充 tags / notes
- 未登录、失败、受限来源的诚实反馈

本阶段不做：媒体上传与图片转存（S7）、视频、工作区选择与整理、搜索、内容去重提示、深色主题、Firefox/Safari、AI 字段。

## 现状

| 项                 | 状态                                                      |
| ------------------ | --------------------------------------------------------- |
| `popup.tsx`        | Plasmo 默认示例，无采集 UI                                |
| Background / 内容脚本 | 未创建                                                 |
| 消息协议           | 未定义                                                    |
| 登录               | `@clerk/chrome-extension` 已安装但未接入                  |
| 数据访问           | 无 Convex 客户端                                          |
| 采集契约           | `packages/contracts` 尚无采集类型（见 `docs/CONTRACTS.md` 的「当前代码差异」） |
| 权限               | `manifest.host_permissions` 仍是脚手架残留的 `https://*/*`，待收敛 |

## 分层职责

| 层           | 职责                                        | 约束                                                     |
| ------------ | ------------------------------------------- | -------------------------------------------------------- |
| Popup        | 呈现状态、补充 tags / notes                 | 生命周期短，不承担编排，不直接调用后端                    |
| Service Worker | 右键菜单、采集编排、`clientRequestId` 生成、保存 | 可随时被终止，跨重启状态不能只放内存                |
| Content Script | 只读页面 title / og:image / description   | 按需注入，非常驻；quote 与 image 不需要读页面            |
| 浏览器适配层 | 封装 `chrome.storage` / `contextMenus` / `scripting` 与消息收发 | 业务代码不直接调用 chrome API，便于 mock |

编排放在 Service Worker 的原因：popup 在用户点击页面其它位置时会关闭，在 popup 内发起保存会被打断。

## 采集流程

| 入口         | kind    | 数据来源                                                    |
| ------------ | ------- | ----------------------------------------------------------- |
| 点击图标     | `page`  | 按需注入读取 title / og:image / description + 当前 URL       |
| 右键选中文字 | `quote` | `chrome.contextMenus` 的 `info.selectionText` + 来源页 URL   |
| 右键图片     | `image` | `info.srcUrl` + 来源页 URL                                   |

三类共用同一个 capture Mutation 和同一套补充 UI，popup 不显示来源类型标题，也不显示缩略图。

## 契约与错误

字段、错误码和幂等语义以 [Contracts](../../docs/CONTRACTS.md) 为准。要点：

- 一个主动操作生成一个 `clientRequestId`；同一次操作的传输重试复用该 ID；用户再次保存是新的 ID。
- 成功结果 `{ inspirationId, created }`。`created=false` 只表示重试命中既有结果，**不表示内容已存在**。
- 主动重复保存创建新内容，不做去重提示。

错误码到界面的映射：

| 错误                  | Popup 表现                       |
| --------------------- | -------------------------------- |
| `UNAUTHENTICATED`     | 未登录态，给登录链接             |
| `INVALID_INPUT`       | 失败态，不自动重试               |
| `WORKSPACE_UNAVAILABLE` | 失败态，不泄露其他账户信息     |
| `SOURCE_UNAVAILABLE`  | 失败态，是否外链降级按 D04       |
| `REQUEST_CONFLICT`    | 失败态，不重试，需修正客户端逻辑 |
| `TEMPORARY_FAILURE`   | 失败态，可用同一 ID 重试         |

## 界面

视觉与结构基准：[Plugin 原型](../../docs/design/prototypes/inspira-plugin.html)。

- 固定 384px 宽（≈1920 宽屏的 1/5），锚定工具栏图标下方、屏幕右上角。**不要用 `vw`**：popup 中的 `vw` 相对 popup 自身视口，`20vw` 会塌缩到接近 0。
- 品牌标记为紫色渐变圆角菱形（`#8B7EF7 → #6C63FF`）；正文 `#20201E`、次级 `#777570`、placeholder `#A09B94`、分隔线 `#EDECE8`；tag chip 用灰白（`#F4F3F0` / `#737169`），紫色只留给品牌标记与链接。
- tag 输入是单行 chip + 输入框同排，右侧自适应；备注单独一行。

五态：

| 状态      | 标题             | 内容                              | 操作               |
| --------- | ---------------- | --------------------------------- | ------------------ |
| 保存中    | —                | spinner + 「正在保存…」           | 无输入控件         |
| 保存成功  | 已保存到 Inspira | tag 单行输入 + 备注                | 在 Inspira 中查看  |
| 已填写    | 已保存到 Inspira | 同上，回显已填 tags / notes        | 在 Inspira 中查看  |
| 未登录    | 无法保存到 Inspira | 「请先登录，再重新保存这一条」   | 登录链接 → landing |
| 无法保存  | 无法保存到 Inspira | 受限页面或网络不可用             | 重试               |

未登录与无法保存共用同一个消息组件，只有文案与操作不同。受限页面（`chrome://`、受保护图片等）一律走失败态，不伪装成功。

## 权限

目标是只申请实际用到的权限：`contextMenus`、`storage`、`activeTab`、`scripting` 及必需域名。

- 移除 `<all_urls>` / `https://*/*`，不预先申请 `tabs`、`cookies`。
- 必需域名在实现时按实际请求确定（候选：Convex 部署域名、Clerk Frontend API 域名），T01/T03 验证前不写死。
- 不加载远程托管代码，不把原型的 CDN 脚本复制进插件。

## 目录结构

现状：`popup.tsx`、`assets/icon.png`、`package.json`、`tsconfig.json`。

规划（文件名随实现确定）：

```text
apps/extension/
  popup.tsx        # 五态 UI
  background.ts    # Service Worker：右键菜单 + 采集编排
  lib/             # 浏览器适配层、Clerk / Convex 接入
  assets/
```

页面读取脚本的打包与注入方式（Plasmo + `chrome.scripting` 按需注入）在 T03 验证。

## 开发

| 用途     | 命令                                   |
| -------- | -------------------------------------- |
| 开发     | `pnpm --filter apps-extension dev`     |
| 构建     | `pnpm --filter apps-extension build`   |
| 打包     | `pnpm --filter apps-extension package`（不代表商店发布） |

开发构建产物在 `build/chrome-mv3-dev`，用 Chrome 的「加载已解压的扩展程序」载入。

环境变量通过 Plasmo 的 `PLASMO_PUBLIC_*` 暴露：Clerk publishable key 与 Convex URL。这些值可进入客户端，不是服务端密钥；仓库只放占位值，真实值不得提交。后端还需要 `CLERK_JWT_ISSUER_DOMAIN`，见 [Development](../../docs/DEVELOPMENT.md#环境配置)。

## 验证

代码变更完成至少运行 `pnpm --filter apps-extension build`。构建通过不代表业务验收。

人工冒烟（加载未打包扩展）：

- 登录 / 退出 / 会话过期
- 点击保存网页、右键划词、右键图片
- 同一请求重试只生成一条；主动保存两次生成两条
- Service Worker 重启后仍能正确反馈
- 未登录态、失败态、受限页面不伪装成功
- 保存后在 Web 端能看到同一条内容及其 tags / notes

未执行的项要明确标注为未执行。

## 待确认与待验证

| 项  | 内容                                     | 影响           |
| --- | ---------------------------------------- | -------------- |
| D04 | 右键图片是否转存优先、失败后是否外链降级 | image 采集     |
| D05 | 登录入口返回路径、是否自动恢复待保存请求 | 未登录流程     |
| T01 | Service Worker 内能否获取 Clerk token 并调用 Convex | 登录与保存链路 |
| T02 | 同请求重试、主动再次保存、Worker 重启    | 幂等与状态持久化 |
| T03 | 普通 / 受保护 / blob / data / 内网页面的图片采集 | 权限与受限来源 |

未定项只在其阻塞当前任务时才需要推动确认，不自行实现「登录后自动恢复草稿」这类未确认行为。

## 相关文档

- 契约：[docs/CONTRACTS.md](../../docs/CONTRACTS.md)
- 架构与待验证项：[docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- 开发命令与验收：[docs/DEVELOPMENT.md](../../docs/DEVELOPMENT.md)
- 产品决策与实现顺序：[docs/PRODUCT.md](../../docs/PRODUCT.md)
- 界面原型：[docs/design/README.md](../../docs/design/README.md)
- 采集变更规格：`openspec/changes/implement-extension-capture/`
