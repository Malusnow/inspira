# Web 局部规则

- 与 [全仓规则](../../AGENTS.md) 一起使用。UI 任务先读 [Product](../../docs/PRODUCT.md) 和 [Design](../../docs/design/README.md)。
- 页面覆盖适用 loading/empty/error/success、键盘焦点和基本响应式。详情浮层按产品已确认布局实现，小屏与非媒体类型在对应 change 明确。
- TDesign 承担正式交互组件，ECharts 承担统计；主题同时作用于两者，原型颜色只是有状态参考，不散布硬编码色替代主题映射。
- 所有数据来自本人鉴权查询；客户端隐藏 UI 不能代替服务端隔离。媒体短时地址按后端授权获取，不在浏览器持有存储秘密。
- 完成代码变化运行 `pnpm --filter web lint`、`pnpm --filter web build`；其他检查见 [Development](../../docs/DEVELOPMENT.md)。
- 核心流程完成后补 Playwright 主流程和固定视口截图；未执行要说明。
