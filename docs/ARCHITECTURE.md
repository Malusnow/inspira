# Inspira Architecture

> 状态：目标架构。当前只有前端、插件和 contracts 脚手架，业务后端尚未建立。

## 结构

| 位置               | 当前事实                                                | 目标职责                                        |
| ------------------ | ------------------------------------------------------- | ----------------------------------------------- |
| apps/web           | React/Vite 示例，依赖含 TDesign、Clerk、Convex、ECharts | 页面路由、交互状态、本人内容实时视图            |
| apps/extension     | Plasmo Popup 示例，依赖 Clerk 扩展 SDK                  | Chrome MV3 保存入口、认证衔接、后台消息         |
| packages/contracts | 五种类型和 CreateInspirationInput；没有运行时校验       | 两端类型、校验、消息与采集协议                  |
| convex/            | 尚未建立                                                | 身份鉴权、Schema、Query/Mutation、必要的 Action |
| 媒体存储           | 尚未选择/接入                                           | 文件本体、受控上传与访问；Convex 管理关联元信息 |

只保留 `packages/contracts` 作为共享包；出现真实重复后再评估新增包。

## 数据边界

| 概念           | 关系与数据边界                                                                |
| -------------- | ----------------------------------------------------------------------------- |
| 用户身份       | 从服务端验证后的 Clerk 会话获得主体，客户端不可指定所有者                     |
| Inspiration    | owner、五种类型之一、类型对应内容、tags、可选单一 workspace、时间；无收藏字段 |
| Workspace      | 属于一个用户；内容最多关联一个；删除归属规则 D08                              |
| Tag            | 内容上的用户字符串，不要求独立标签 ID；聚合结果也按 owner 限定，规范化 D06    |
| MediaAsset     | owner、服务端关联的存储标识、真实元信息、可用/处理状态；清理 D01b             |
| CaptureAttempt | owner + clientRequestId 关联操作结果，区别新的主动操作与重试；生命周期需 T02  |
| Preferences    | 模式、主色、视图等；跨设备/插件同步范围 D10                                   |

Note 不依赖媒体。Image/Video 的外部来源和受管文件必须分开建模。字段和索引在对应 change 定稿。

## 数据流

```text
Web / Extension -> Clerk session token
Web / Extension -> authenticated backend -> owner-scoped Query / Mutation
Mutation -> private content -> Web reactive query -> cards
Client -> upload authorization -> storage -> finalize validation -> MediaAsset
Selected tag -> owner-scoped frequency/content query -> Serendipity
```

Web 创建与插件采集进入同一内容域。插件 Popup 负责反馈和补充；Service Worker 负责右键菜单、路由和后台保存；Content Script 只读取必要页面信息。

采集和媒体上传是两条路径。采集协议见 [Contracts](CONTRACTS.md)；大文件不放进普通采集 Mutation。

## 权限

- 每次读写验证用户身份。
- 内容、工作区、文件关联必须同 owner。
- 搜索、统计、标签聚合和词云只使用当前用户数据。
- 上传 URL 签发和文件访问独立鉴权。
- 完成媒体绑定时不能只信任客户端提供的存储 ID。
- 日志和错误不泄露其他用户数据或 Token。

## 待技术验证

| ID  | 验证                                         |
| --- | -------------------------------------------- |
| T01 | Web/插件登录、退出、Token 过期、两账户隔离   |
| T02 | 同请求重试、主动再次保存、Worker 重启        |
| T03 | 普通/受保护/blob/data/内网页面的图片采集     |
| T04 | 大文件、慢网、取消、视频编码、短时访问       |
| T05 | 词频差异、长标签、小视口、主题对比、键盘点击 |
