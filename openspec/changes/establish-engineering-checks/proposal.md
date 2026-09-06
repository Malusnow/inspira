## Why

Inspira 的 S0 工程检查尚未落实：根 test 是失败占位，独立类型检查与统一构建缺失，Vitest 和 CI 文件为空。需要在业务开发前建立从干净检出可运行、能真实发现错误的验证入口，避免空跑或跳过工作区造成假通过。

## What Changes

- 建立根 pnpm typecheck、pnpm test、pnpm build，明确覆盖 Web、插件与 source-only contracts 的方式及失败传播。
- 为三个工作区配置真实类型检查；Web/插件继续使用现有生产构建器，contracts 保持源码导出且明确没有独立运行时 bundle。
- 配置 Vitest，使用现有公共类型的正反例作为首批类型回归测试；开启实际类型测试执行，零测试必须失败。明确当前无业务运行时测试，不为示例页面编写凑数测试。
- 建立 GitHub Actions PR/push 验证：固定工具版本、冻结锁文件安装、执行相同入口与已有 Web lint，无需秘密或外部后端。
- 验证正常路径及类型错误、错误断言、零测试和构建失败的非零退出；同步文档/规则的实际验证能力。

## Capabilities

### New Capabilities

- `engineering-checks`: 开发者与 CI 可依赖的命令覆盖、错误退出、类型回归测试、生产构建及可重复安装行为。

### Modified Capabilities

无。此前工程基线 change 已完成但未归档；本变更不修改其历史规格，不依赖已存在的主规格。

## Impact

计划修改根/各工作区 package.json、pnpm-lock.yaml、vitest.config.ts、相关 tsconfig、.github/workflows/ci.yml，必要时补根工具类型配置及 .gitignore 的生成产物规则。

计划新增 contracts 测试配置与 tests/\*.test-d.ts；两端类型检查配置按现有版本调整。同步 AGENTS.md、两端局部规则、docs/DEVELOPMENT.md、docs/PRODUCT.md 的 S0 状态。

不新增登录、Note、采集、上传、Schema、运行时字段校验或新权限，不替换框架、不统一两端 React/TypeScript 版本、不搭建发布流程。必要工具依赖变更限于测试与类型配置。仅规划本 change，待用户审阅后另行 apply。
