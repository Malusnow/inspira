# Chrome 插件局部规则

与[全仓规则](../../AGENTS.md)一起使用。采集字段与错误码先读 [Contracts](../../docs/CONTRACTS.md)，界面基准是 [Plugin 原型](../../docs/design/prototypes/inspira-plugin.html)，开发与验证流程见 [README](README.md)。

## 职责边界

- Popup 只做状态呈现与 tags / notes 补充，不承担采集编排，不直接调用后端。
- Service Worker 负责右键菜单、采集编排、`clientRequestId` 生成与保存。
- Content Script 按需注入，只读必要页面信息（title、og:image、description）；quote 与 image 不需要读页面。
- 业务代码通过薄浏览器适配层调用 chrome API，不散落直接调用，保证可 mock。

## 状态与幂等

- Service Worker 可随时终止，跨重启状态不能只放内存；持久化方式在 T02 验证。
- 一次主动操作生成一个 `clientRequestId`；同一次操作的传输重试复用该 ID；用户再次保存是新的 ID、新内容。
- 不做内容去重提示，重复保存按正常成功处理。
- `created=false` 只表示请求重试命中既有结果，不表示内容已存在。

## 契约与消息

- Content Script、Popup、Worker 之间的消息使用 contracts 类型并做运行时校验。
- 不信任消息中的身份或所有权；owner 只由验证后的会话确定。
- 采集字段或错误码变更必须同步 `packages/contracts`、Convex、插件与 `docs/CONTRACTS.md`。

## 权限与隐私

- 只申请实际用到的权限：`contextMenus`、`storage`、`activeTab`、`scripting` 及必需域名。
- 不预先申请 `<all_urls>`、`tabs`、`cookies`；现有 `https://*/*` 是待收敛的脚手架配置。
- 认证 Token 交由 SDK 管理，不自行记录。不记录或上报 Token、完整用户内容、敏感网页数据。
- 不加载远程托管代码，不把原型的 CDN 执行脚本复制进插件。

## 反馈

- 点击保存、右键图片、划词保存都必须有成功、失败、未登录反馈。
- 受限页面（`chrome://`、受保护图片等）不伪装成功，走统一失败态。
- 登录入口与登录后恢复策略按 D05；未确认前不自行实现草稿自动恢复。

## 验证

- 代码变更完成运行 `pnpm --filter apps-extension build`；其他检查见 [Development](../../docs/DEVELOPMENT.md)。
- 加载未打包扩展做 Chrome 人工冒烟（登录、三类采集、同请求重试、主动两次、Worker 重启、未登录、失败）；未执行要说明。
