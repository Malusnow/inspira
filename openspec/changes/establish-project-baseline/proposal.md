## Why

Inspira 已建立 Web、插件脚手架与 OpenSpec，但产品文档、原型和最新产品决策存在冲突，架构与验证说明尚未成形。需要在业务编码前建立可追溯的需求和工程协作基线，使后续代理能区分确认行为、建议方案和实现缺口。

## What Changes

- 修订产品与工程文档：取消收藏及旧内容回顾；明确单工作区、视频上传、主动重复保存、字符串标签和按频度突出标签的 Serendipity。
- 建立模块与流程映射、依赖顺序、决策台账，所有关键条目标为已确认、建议、待决定或需要技术验证，并独立记录实现状态。
- 补充架构、采集契约、媒体存储方案、开发说明、验证矩阵、设计索引与 Token 说明。
- 建立文档权威来源和同步机制，明确根/局部 AGENTS.md、OpenSpec 配置、生成的 skills 与测试工具的分工。
- 形成逐项确认未定问题的流程，以及进入每个代码切片前的条件；允许无关切片在已明确范围内推进。

## Capabilities

### New Capabilities

- `project-baseline`: 项目需求、决策与架构文档的维护规则，包含事实状态、模块追踪、契约和设计冲突处理。
- `engineering-workflow`: 编码代理读取依据、规划、实施、验证与交接的协作行为，以及真实验证能力和后续编码入口的识别规则。

这两项规格约束工程协作与文档维护行为，不声明五种内容、上传或 Serendipity 已实现。业务能力的实现规格由后续独立 change 建立。

### Modified Capabilities

无，当前没有主规格。

## Impact

- 后续 apply 更新：`AGENTS.md`、`docs/PRODUCT_BRIEF.md`、`docs/ENGINEERING_HARNESS.md`、现有空白 `docs/architecture.md`、`openspec/config.yaml`。
- 后续 apply 新增：`apps/web/AGENTS.md`、`apps/extension/AGENTS.md`、`docs/requirements-map.md`、`docs/capture-contract.md`、`docs/media-storage.md`、`docs/development.md`、`docs/verification.md`、`docs/design/README.md`、`docs/design/tokens.md`。
- 原型只读；不一致之处在设计索引中标为失效参考，并列出后续修改范围，不在本次重写 HTML。
- 不修改业务源码、契约 TypeScript、package.json、锁文件、测试/CI 配置、环境文件或 OpenSpec 生成的 skills；不安装依赖、不部署、不执行技术 Spike。
- 当前 propose 仅生成本 change 的规划文件；审阅后需用户另行请求 apply 才执行上述文档任务。
