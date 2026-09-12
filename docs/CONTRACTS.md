# Inspira Contracts

> 状态：接口和数据契约基线。本文描述目标行为；实际可执行契约以 `packages/contracts`、后端函数和测试为准。

## 共享原则

- 客户端不提交可信 `userId` 或 `owner`；服务端从已验证会话确定用户。
- 所有内容、工作区、标签聚合、统计和媒体关联都必须验证所有权。
- TypeScript 类型不是安全边界；服务端要做运行时校验。
- 契约改动必须同步 `packages/contracts`、Web、插件、后端、测试和本文。
- 文档示例不是稳定 API，未实现字段不能在交付中写成已上线。

## 内容模型

目标实体：

| 实体           | 核心字段                                                            |
| -------------- | ------------------------------------------------------------------- |
| Inspiration    | owner、type、类型字段、tags、可选 workspaceId、createdAt、updatedAt |
| Workspace      | owner、name、createdAt、updatedAt                                   |
| MediaAsset     | owner、存储标识、真实类型、大小、状态、createdAt                    |
| CaptureAttempt | owner、clientRequestId、payload 指纹、结果 inspirationId、状态      |
| Preferences    | owner、theme、primaryColor、默认视图等                              |

`type` 支持 `page`、`image`、`quote`、`note`、`video`。S1 已定稿 Note 最小字段；其他类型字段名、索引、分页和长度上限在对应实现 change 中定稿。

## Web Note 契约

Web Note 不走插件采集请求。客户端提交：

| 字段        | 条件          | 限制                                                       |
| ----------- | ------------- | ---------------------------------------------------------- |
| title       | 可选          | trim 后为空视为未提供；最多 120 字符                       |
| content     | 必须          | trim 后必须非空；最多 10000 字符                           |
| notes       | 可选          | 右侧详情备注；trim 后为空视为未提供；最多 5000 字符        |
| tags        | 可选 string[] | trim、移除空字符串、同条去重；最多 12 个，每个最多 40 字符 |
| workspaceId | 可选          | S1 UI 不提供工作区选择；服务端允许为空                     |

客户端不得提交可信 `owner` 或 `userId`。服务端从已验证会话获得 owner，并将 Note 保存为 `Inspiration` 的 `type: "note"`。成功创建返回新 Note 的 ID；无登录返回 `UNAUTHENTICATED`，字段不合法返回 `INVALID_INPUT`，均不得创建内容。

Web 编辑层可使用块编辑器提供基础排版体验；S1 提交给服务端的仍是 `content` 字符串，不提交可信富文本 JSON 结构。详情浮层左侧只展示已保存的 `content`；右侧 `notes` 是单独的用户备注，不覆盖原始正文。

更新 Web Note 时，客户端必须提交目标 `id` 与完整新内容。服务端必须重新读取目标 Note 并验证 owner；跨用户或不存在的 ID 不得修改内容。

All 的 S1 查询只返回当前登录用户自己的 Note，按最新创建在前展示。详情查询必须再次验证 owner；跨用户 ID 返回空结果或授权错误，不能返回标题、正文或 tags。

首次进入 All 时，Web 可请求服务端为当前 owner 初始化一组默认 Note 卡片。初始化只在该 owner 没有现有 Note 且未记录过初始化标记时写入；服务端仍从已验证会话确定 owner，不接受客户端提交 owner。初始化内容写入后就是该用户自己的 Note 数据，后续按普通 Note 查询和展示。

## 采集请求

插件只采集 `page`、`image`、`quote`。Web Note 与 Video 上传不走采集请求。

| 字段            | 条件                                | 含义                               | 限制                                               |
| --------------- | ----------------------------------- | ---------------------------------- | -------------------------------------------------- |
| clientRequestId | 必须                                | 一次主动操作生成一次；传输重试复用 | trim 后必须非空；最多 128 字符                     |
| kind            | 必须，page/image/quote              | 采集类型                           | 只接受三种；其他值返回 INVALID_INPUT               |
| sourceUrl       | page/quote 必须，image 建议带来源页 | 来源页面 URL                       | http/https 绝对地址；最多 2048 字符                |
| pageTitle       | 可选                                | 页面标题                           | trim 后为空视为未提供；最多 300 字符               |
| description     | 可选                                | 页面摘要，作为 page 的正文         | trim 后为空视为未提供；最多 1000 字符              |
| selectedText    | quote 必须                          | 选中文字                           | trim 后必须非空；最多 10000 字符                   |
| imageUrl        | image 必须                          | 原图片地址                         | http/https 绝对地址；最多 2048 字符                |
| note            | 可选                                | 用户备注                           | trim 后为空视为未提供；最多 5000 字符              |
| workspaceId     | 可选                                | 本人工作区                         | 不裁剪不截断；服务端校验归属                       |
| tags            | 可选 string[]                       | 用户输入标签                       | trim、去空、同条去重；最多 12 个，每个最多 40 字符 |
| capturedAt      | 建议                                | 客户端时间，仅作上下文             | 有限数字时间戳；不参与排序                         |

上表限制与 `packages/contracts/src/index.ts` 的采集契约常量逐项对应，由 `normalizeCaptureRequest` 在写入前统一执行。

`data:`、`blob:` 等非 http(s) 地址不通过校验，按无法保存处理（T03 记录实际页面行为）。`sourceUrl` 对 image 是来源页上下文，缺失不影响采集成功。

成功结果建议：

```ts
{
  inspirationId: string
  created: boolean
}
```

`created=false` 表示同一用户同一 `clientRequestId` 的重试命中了既有结果，不表示 URL 已存在。相同 `clientRequestId` 搭配不同 payload 应返回冲突。

## 采集错误

| 错误                  | 用户含义                 | 处理                     |
| --------------------- | ------------------------ | ------------------------ |
| UNAUTHENTICATED       | 未登录或会话过期         | 引导登录；恢复策略见 D05 |
| INVALID_INPUT         | 字段、URL 或类型不合法   | 停止自动重试             |
| WORKSPACE_UNAVAILABLE | 工作区不可用             | 不泄露其他账户详情       |
| SOURCE_UNAVAILABLE    | 页面或图片无法读取       | 按 D04 决定是否外链降级  |
| REQUEST_CONFLICT      | 同请求 ID 被不同内容复用 | 停止重试并修正客户端逻辑 |
| TEMPORARY_FAILURE     | 网络或服务暂时失败       | 同次操作复用 ID 重试     |

## 插件消息协议

popup 只呈现状态，采集编排在 Service Worker，两者按 `apps/extension/lib/messages.ts` 的类型收发：

| 消息                  | 方向           | 结果                                                       |
| --------------------- | -------------- | ---------------------------------------------------------- |
| `auth-status`         | popup → worker | 返回 `authenticated` / `anonymous` / `unknown`             |
| `capture-active-page` | popup → worker | 生成新 `clientRequestId` 采集当前页，返回 `CaptureOutcome` |
| `update-details`      | popup → worker | 按内容 id 写回 tags / note，返回 `saved: boolean`          |

`CaptureOutcome` 为 `saved` / `unauthorized` / `failed` 三态，popup 据此渲染五状态：保存中、保存成功（含已填写）、未登录、无法保存。请求进入业务前必须通过 `isExtensionRequest` 的运行时校验。

右键采集时 popup 尚未打开：worker 先把结果写入 `chrome.storage.session` 的 `inspira_pending_capture`，再请求打开 popup；popup 读取并消费该结果，因此 Worker 重启不丢反馈。`update-details` 只改标签与备注，不改内容本体；note 为空表示不修改。

插件不在自身弹窗内登录：popup 与 worker 都通过 Clerk 的 `syncHost` 从登录主机读取会话 cookie（开发为 `http://localhost`，生产为 Frontend API 主机，D05），所以「未登录 → 登录 → 重新保存」是用户可见的两步，不存在隐式恢复。

## 媒体契约

上传流程：

1. 客户端选择文件并做友好提示。
2. 服务端验证登录、额度和预期类型，创建上传尝试并签发限定用途的上传地址。
3. 客户端直传文件，展示进度、失败和取消。
4. 完成提交时，服务端验证上传记录属于当前用户，并核实对象存在、实际大小、类型和完整性。
5. 验证成功后绑定 `MediaAsset` 与 `Inspiration`。
6. 失败、取消或孤立对象进入可重试清理流程。

访问流程：

- 查询内容时只返回业务元信息，不暴露永久公共文件地址。
- 详情需要展示媒体时，服务端确认当前用户拥有内容和资产，再签发短时访问地址。
- 短时地址过期后重新授权；有效期内可能被转发，不等于逐次登录鉴权。

限制已确认：

- 图片：JPG、PNG、WebP、GIF，单张不超过 20MB。
- 视频：MP4 H.264/AAC，单个不超过 200MB 且不超过 10 分钟。
- 首版不自动转码。

仍待确认：总额度 D03b、视频封面 D03c、删除后的媒体清理策略 D01b。

## Insights 统计契约

统计口径已确认：

- 统计只反映当前存量的内容；内容删除后立即从总数、构成、热力图和趋势中消失。
- 日、周、月边界按调用方传入的 IANA 时区解析；缺失或非法时区回退 UTC。
- 周起始日为周一。
- 标签频度按"一条内容对一个去重后的标签计一次"。

查询：

| 项   | 值                                                          |
| ---- | ----------------------------------------------------------- |
| 函数 | `insights.summary`                                          |
| 入参 | `timeZone?: string`（IANA 时区名，如 `Asia/Shanghai`）      |
| 鉴权 | 从已验证会话取 owner，只读取该 owner 的 `inspirations` 行   |
| 校验 | 未知时区回退 UTC，不报错，不信任客户端传入的任何 owner 标识 |

返回 `InsightsSummary`：

| 字段                                | 含义                                                       |
| ----------------------------------- | ---------------------------------------------------------- |
| totalCount                          | 当前存量总数                                               |
| createdThisMonth / createdLastMonth | 本月 / 上月新增                                            |
| createdThisWeek / createdLastWeek   | 本周 / 上周新增                                            |
| activeDayCount                      | 最近 30 天内有内容的天数                                   |
| dailyCounts                         | 最近 365 天逐日计数，升序零填充，`date` 为 `YYYY-MM-DD`    |
| typeCounts                          | 固定顺序 `page/image/quote/note/video` 的类型计数，含 0 值 |
| topTags                             | 标签频度前 5，次数降序，同次数按标签升序                   |

窗口与上限常量位于 `packages/contracts`：`INSIGHTS_HEATMAP_WINDOW_DAYS`、`INSIGHTS_ACTIVE_WINDOW_DAYS`、`INSIGHTS_TOP_TAG_LIMIT`、`INSIGHTS_WEEK_START_DAY`。聚合与日期分桶是纯函数，位于 `packages/contracts` 的 `buildInsightsSummary`，Web 与 Convex 共用同一实现。

## 当前代码差异

采集协议已在 `packages/contracts/src/index.ts` 落地：`CaptureKind`、`CaptureRequestInput`、`CaptureRequest`、`CaptureResult`、`CAPTURE_ERROR_CODES` 与 `normalizeCaptureRequest` 运行时校验，字段与限制见上一节。

服务端与插件调用端已接通：`convex/captures.ts` 提供 `captures:capture`（按 `clientRequestId` 幂等）与 `captures:updateDetails`，`convex/schema.ts` 已放开五种 `inspirations.type` 并新增 `captureAttempts`；`apps/extension` 实现了三类采集编排（`lib/capture.ts`、`background.ts`）、五状态 popup 与 tags/notes 回写，消息协议见上一节。

仍未实现：媒体资产绑定与直传（S7）。插件的 `manifest` 已声明 `contextMenus` / `storage` / `activeTab` / `scripting` / `cookies`，两个 host 为 `$PLASMO_PUBLIC_CLERK_SYNC_HOST/*` 与 `$CLERK_FRONTEND_API/*`（构建期插值，`cookies` 用于按 D05 从登录主机同步 Clerk 会话），不使用全量域名；生产同步域名随 D10 填入 `.env.production`。
