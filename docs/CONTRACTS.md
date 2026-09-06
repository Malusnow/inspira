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

| 实体 | 核心字段 |
| --- | --- |
| Inspiration | owner、type、类型字段、tags、可选 workspaceId、createdAt、updatedAt |
| Workspace | owner、name、createdAt、updatedAt |
| MediaAsset | owner、存储标识、真实类型、大小、状态、createdAt |
| CaptureAttempt | owner、clientRequestId、payload 指纹、结果 inspirationId、状态 |
| Preferences | owner、theme、primaryColor、默认视图等 |

`type` 支持 `page`、`image`、`quote`、`note`、`video`。字段名、索引、分页和长度上限在对应实现 change 中定稿。

## 采集请求

插件只采集 `page`、`image`、`quote`。Web Note 与 Video 上传不走采集请求。

| 字段 | 条件 | 含义 |
| --- | --- | --- |
| clientRequestId | 必须 | 一次主动操作生成一次；传输重试复用 |
| kind | 必须，page/image/quote | 采集类型 |
| sourceUrl | page/quote 必须，image 建议带来源页 | 来源页面 URL |
| pageTitle | 可选 | 页面标题 |
| selectedText | quote 必须 | 选中文字 |
| imageUrl | image 必须 | 原图片地址 |
| note | 可选 | 用户备注 |
| workspaceId | 可选 | 本人工作区 |
| tags | 可选 string[] | 用户输入标签 |
| capturedAt | 建议 | 客户端时间，仅作上下文 |

成功结果建议：

```ts
{
  inspirationId: string
  created: boolean
}
```

`created=false` 表示同一用户同一 `clientRequestId` 的重试命中了既有结果，不表示 URL 已存在。相同 `clientRequestId` 搭配不同 payload 应返回冲突。

## 采集错误

| 错误 | 用户含义 | 处理 |
| --- | --- | --- |
| UNAUTHENTICATED | 未登录或会话过期 | 引导登录；恢复策略见 D05 |
| INVALID_INPUT | 字段、URL 或类型不合法 | 停止自动重试 |
| WORKSPACE_UNAVAILABLE | 工作区不可用 | 不泄露其他账户详情 |
| SOURCE_UNAVAILABLE | 页面或图片无法读取 | 按 D04 决定是否外链降级 |
| REQUEST_CONFLICT | 同请求 ID 被不同内容复用 | 停止重试并修正客户端逻辑 |
| TEMPORARY_FAILURE | 网络或服务暂时失败 | 同次操作复用 ID 重试 |

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

## 当前代码差异

当前 `CreateInspirationInput` 只有基础字段，没有 `clientRequestId`、采集结果/错误、消息协议、媒体资产绑定和运行时校验。编码时必须在对应 change 中补齐 contracts、调用端、服务端和测试。
