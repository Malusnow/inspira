# Chrome 插件局部规则

- 与 [全仓规则](../../AGENTS.md) 一起使用；采集/消息先读 [Contracts](../../docs/CONTRACTS.md)。
- 首版 Chrome MV3。Popup 负责反馈与补充；Service Worker 负责右键菜单/路由/保存；Content Script 只读必要页面数据。业务通过薄浏览器适配层使用 chrome API。
- Worker 可随时终止，跨重启状态不能只放内存。新主动操作与同操作重试 ID 区分，状态持久化在 T02 验证。认证 Token 交由 SDK 管理，不自行记录敏感内容。
- Content Script 与后台消息使用 contracts 类型和运行时校验；不信任来源消息中的身份或所有权。
- 权限按实际功能选择 activeTab/contextMenus/storage 及必需域名；不预先申请 <all_urls>/tabs/scripting/cookies。增加权限记录用途与验证证据，现有 https://_/_ 是待收敛脚手架配置。
- 不加载远程托管代码，不复制原型 CDN 执行脚本进插件；不记录 Token、完整用户内容或敏感网页数据。
- 点击/图片右键/划词保存都有成功、失败及未登录反馈；受限页面不伪装成功，自动登录恢复策略按 D05。
- 代码变更完成运行 `pnpm --filter apps-extension build`；其他检查见 [Development](../../docs/DEVELOPMENT.md)。加载未打包扩展做 Chrome 人工冒烟；未执行要说明。
