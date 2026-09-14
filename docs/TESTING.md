# Inspira Testing

## 目标结构

测试按“被测边界”归属，而不是按临时方便位置归属：

| 层级        | 推荐位置                                         | 覆盖内容                                     | 当前对应文件                                          |
| ----------- | ------------------------------------------------ | -------------------------------------------- | ----------------------------------------------------- |
| 共享契约    | `packages/contracts/src/**/*.test.ts`          | 纯类型邻近的运行时校验、归一化、聚合纯函数   | `packages/contracts/src/index.test.ts`              |
| Web 单元    | `apps/web/src/**/*.test.ts(x)`                 | UI view model、hooks、主题算法、渲染无关工具 | `apps/web/src/features/**`、`apps/web/src/lib/**` |
| Web 组件    | `apps/web/src/**/__tests__/*.test.tsx`         | 需要 DOM、交互、可访问性断言的 React 组件    | 后续新增                                              |
| Convex 后端 | `convex/**/*.test.ts`                          | Convex function、权限、幂等、数据隔离        | `convex/*.test.ts`                                  |
| 集成/E2E    | `tests/e2e/**/*.spec.ts`                       | Web + Convex + Clerk 流程、插件关键路径      | 后续新增                                              |
| 测试夹具    | `tests/fixtures/**` 或就近 `__fixtures__/**` | 可复用数据、HTML、媒体样本                   | 后续新增                                              |

## 命名规则

- 纯函数测试使用 `*.test.ts`，组件测试使用 `*.test.tsx`，端到端测试使用 `*.spec.ts`。
- 邻近测试优先：与源码强耦合、只服务一个模块的测试放在同目录。
- 跨包夹具放 `tests/fixtures`；不要从 `apps/web/src` 反向 import 后端夹具。
- 测试 helper 以 `testUtils.ts` 或 `*.test-helper.ts` 命名，不混入生产导出。

## 当前整理建议

1. `packages/contracts/src/index.test.ts` 拆成领域测试：
   - `packages/contracts/src/workspaces.test.ts`
   - `packages/contracts/src/capture.test.ts`
   - 后续新增 `media.test.ts`、`insights.test.ts`
2. `apps/web/src/features/insights/*.test.ts` 保持就近，属于 feature view model 和图表 option 测试。
3. `apps/web/src/lib/theme/*.test.ts` 保持就近，属于主题算法单元测试。
4. `apps/web/src/features/notes/mediaReferences.test.ts` 若只覆盖 contracts helper，应迁到 `packages/contracts/src/notes.test.ts`；若覆盖 Note 编辑器消费行为，则保留在 notes feature。
5. `convex/*.test.ts` 暂保持在 `convex/` 根，等后端模块继续增多后再按 `convex/__tests__/notes.test.ts` 或 `convex/notes.test.ts` 统一。

## 运行入口

当前命令与规划命令：

| 命令                                      | 作用                            |
| ----------------------------------------- | ------------------------------- |
| `pnpm test`                             | 全仓库非 E2E 测试，必须真实失败 |
| `pnpm --filter web test`                | Web 单元/组件测试               |
| `pnpm --filter @inspira/contracts test` | 契约测试                        |
| `pnpm test:convex`                      | Convex 后端测试                 |
| `pnpm test:e2e`                         | 跨应用 E2E，允许单独配置环境    |

根 `vitest.config.ts` 需要明确包含 `packages/contracts/src/**/*.test.ts`、`apps/web/src/**/*.test.ts(x)` 和 `convex/**/*.test.ts`，并排除 `node_modules`、`dist`、`.plasmo` 等产物目录。

## 约束

- CI 至少分三段：lint/typecheck、unit/backend tests、build；E2E 可独立为需要环境的 job。
- 每个 bug fix 至少补一条会在修复前失败的测试，除非是纯样式且有截图验收说明。
- 权限、所有权、幂等、契约校验属于后端/共享契约的必测范围。
- 测试数据不得包含真实用户内容、真实网页全文、Token 或完整私密媒体。
- 快速单元测试不依赖网络、真实 Clerk、真实 Convex deployment；需要外部服务的测试必须单独标记并从默认 `pnpm test` 排除。
