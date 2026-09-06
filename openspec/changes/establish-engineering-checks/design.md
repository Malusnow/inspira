## Context

动机见 proposal.md。当前根 test 为失败占位；根 Vitest 配置和 CI 文件为空。Web 已有 `tsc -b && vite build` 与 ESLint；插件已有 Plasmo build；contracts 仅导出 TypeScript 源码，没有脚本或运行时业务逻辑。两端页面仍为脚手架，无业务测试，尚无 Convex 后端。

Web 使用 TypeScript 6.0.2、React 19、Vite 8.2.2；插件使用 TypeScript 5.3.3、React 18、Plasmo 0.90.5，不能为统一命令顺带统一版本。插件 tsconfig 引用 `.plasmo/index.d.ts`，干净检出时该文件可能不存在。工作区名称实际为 `web`、`apps-extension`、`@inspira/contracts`。

本设计承接 docs/PRODUCT.md 的 S0；先前 establish-project-baseline 的文档完成不代表检查已经可运行，不修改其历史任务。当前仅规划，以下技术选型均为建议实施方案，完成状态须由 apply 的运行证据确认。

## Goals / Non-Goals

**Goals:** 建立覆盖范围明确、错误能传播、干净检出可重复执行的检查链；保持源码契约包和两个应用的现有边界。

**Non-Goals:** 不引入业务功能、运行时契约校验、浏览器端到端测试或发布流程；不把类型测试描述为运行时行为覆盖，不新增示例计数器测试凑数。

## Decisions

### 1. 根命令明确编排工作区

建议使用显式工作区命令串联，失败即停止，不使用 `--if-present` 跳过目标：

| 根入口           | 实际覆盖                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `pnpm typecheck` | Web 编译器检查、插件编译器检查、contracts 类型检查、根测试配置类型检查 |
| `pnpm test`      | Vitest 非监听执行 contracts 类型正反例，开启真实 typecheck             |
| `pnpm build`     | contracts 类型检查、Web Vite 生产构建、插件 Plasmo 生产构建            |

Web 复用现有项目引用，确保检查源码和 Vite 配置。contracts 新增自身 tsconfig/typecheck，保持源码 exports，不制造无意义 bundle 或 echo build。根工具配置用独立 tsconfig 纳入检查。插件使用本工作区 TS5，不让根工具的 TS6 配置或测试依赖泄漏进插件源码范围。

插件优先增加独立 `tsconfig.typecheck.json`，继承真实 Plasmo 编译选项、显式限定现有源码并清理对尚未生成入口声明的依赖；不能添加空声明或 any 掩盖错误。如果实际源码依赖生成类型，必须使用该版本 Plasmo 的真实生成流程作为前置步骤并验证从零生成。当前没有该类源码依赖，具体配置由干净检出实验确认。

不引入任务编排框架，现有三个工作区无需额外缓存或依赖图服务。

### 2. 首批测试验证现有公共类型

建议在根显式声明 Vitest 及根配置所需 TypeScript 开发依赖，版本与现有 Web 工具兼容；更新锁文件，不依赖偶然提升到根的依赖。`packages/contracts/tests/*.test-d.ts` 通过公共 exports 导入类型，以 `expectTypeOf` / `assertType` 检查当前内容类型集合、tags 字符串数组、workspaceId 单个可选字符串及允许的可选字段。正例能够赋值，反例拒绝非法内容类型、数字标签和工作区数组。只测试现有类型，不固化文档中尚未实现的字段约束。

根 `vitest.config.ts` 显式配置类型测试范围与 typecheck 执行；不得仅运行普通测试文件中的类型断言调用。保持零测试失败、不忽略源码类型错误、不提交 skip/only。若使用 `@ts-expect-error`，错误行只保留目标类型错误，防止导入拼写错误掩盖断言。

当前 Web、插件没有业务测试，不分别建立空跑成功的 test 脚本。文档明确根 test 当前覆盖 contracts 静态契约；未来真实运行时测试可按 Vitest projects 隔离各工作区环境及 React 版本，不在本次预置空项目。

### 3. CI 复用本地入口

建议 CI 固定 Node 22.23.1、pnpm 10.26.0；后者来自根 packageManager，前者兼容本地已安装 Vite/Vitest 的 engine 范围。GitHub Actions 在 push、pull_request 触发，使用 Ubuntu、最小 `contents: read` 权限，依次 checkout、设置 pnpm/Node、`pnpm install --frozen-lockfile`、typecheck、test、现有 `pnpm --filter web lint`、build。

只缓存依赖存储，不依赖 `.plasmo`、dist 或历史构建输出。必要命令不设 continue-on-error，不使用线上 Clerk/Convex 凭据。Action 版本在实施时核对其官方支持后固定；不在本任务设置仓库分支保护或发布。

### 4. 用受控失败证明检查有效

在隔离临时副本或仅由本任务创建的临时 fixture 中，分别注入三个工作区类型错误、矛盾类型断言、空测试集合、两端无法解析的生产导入；捕获对应根命令非零退出和有效诊断。另验证冻结安装拒绝清单与锁文件不一致。不得覆盖用户已有文件或把故障修改留下；清理自身临时内容后重跑正常路径。

正常构建检查 Web 产物及插件 MV3 manifest/引用资源真实存在。无需为这些一次性验收实验搭建通用测试框架。结果写入 docs/DEVELOPMENT.md，包含环境、命令、退出码、覆盖和限制；远端 CI 未触发时明确写未验证，不冒充远端绿灯。

### 5. 规则记录实际能力

实施后按真实结果更新根/两端 AGENTS、docs/DEVELOPMENT.md 和 docs/PRODUCT.md 的 S0。根规则写统一入口，局部规则保留对应工具边界，验证细节集中在 DEVELOPMENT。保持 OpenSpec 配置与生成 skills 原样，无需复制脚本说明到多处。

## Risks / Trade-offs

- [Plasmo 生成文件及 TS5 兼容性] → 在没有 `.plasmo` 的隔离环境执行类型检查与生产构建；修复限于检查配置，不能降低检查或升级业务依赖求通过。
- [类型测试有编译器执行成本，且不能证明运行时行为] → 首批仅覆盖现有契约，记录边界，业务变更再增加对应行为测试。
- [现有依赖可能暴露 Node、ESLint 或构建兼容问题] → 保留实际诊断，优先调整必要工程配置；若必须更换技术栈或修改业务逻辑，报告阻塞而不扩大范围。
- [本地成功不等于远端 CI 成功] → 分开记录；本次不自动提交、推送或修改远端设置。

## Migration Plan

先补类型入口和真实测试，再接生产构建及 CI，最后完成干净安装、正常/失败实验和文档更新。没有业务数据迁移；必要回退仅撤销本 change 的工程配置及工具依赖改动，保护已有未提交内容。

## Open Questions

没有待确认产品决策。需要技术验证：Plasmo 干净检出类型检查、Vitest 当前版本的类型测试发现/零测试退出、两端生产构建和冻结安装。上述实验已纳入任务，不代表目前已通过。

## References

检索日期：2026-09-06；精确版本和配置以仓库 package.json、锁文件与已安装包为准。

- [Vitest 官方类型测试说明](https://github.com/vitest-dev/vitest/blob/main/docs/guide/testing-types.md)：类型测试必须开启编译器检查。
- [Vitest 零测试配置](https://main.vitest.dev/config/passwithnotests)：保留无测试失败行为。
- [Vitest projects](https://main.vitest.dev/guide/projects)：未来按工作区隔离测试环境的扩展方式；在线 main 文档与安装版本的适配在实施时验证。
