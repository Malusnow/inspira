## 1. 类型检查与工具依赖

- [ ] 1.1 在根声明实际使用的测试/类型配置开发依赖，保持两端现有 React/TypeScript 版本并更新锁文件；验证 `pnpm install --frozen-lockfile` 成功且依赖变更仅涉及本次工程工具。
- [ ] 1.2 为 Web 建立独立 typecheck 入口，复用现有项目引用覆盖源码与 Vite 配置；验证 `pnpm --filter web typecheck` 实际调用编译器并通过。
- [ ] 1.3 为插件建立 typecheck 入口及必要独立配置，解决 `.plasmo` 生成类型前置条件；验证 `pnpm --filter apps-extension typecheck` 在无历史 `.plasmo` 的隔离副本成功，未使用空声明或忽略源码错误。
- [ ] 1.4 为 contracts 配置源码类型检查，并补根测试配置的类型检查；接通根 `pnpm typecheck` 显式覆盖所有目标，验证成功日志包含三个工作区与根配置，缺失目标不能静默跳过。

## 2. 真实契约类型测试

- [ ] 2.1 添加通过公共 exports 导入的 contracts 类型正反例，覆盖内容类型、字符串 tags、单个可选 workspaceId 及现有可选字段；核对每个反例针对实际约束且不引入新业务契约。
- [ ] 2.2 填充根 Vitest 配置并替换占位 test 为非监听命令，开启编译器类型测试；验证 `pnpm test` 实际发现并执行 2.1 的断言，报告类型测试结果，不忽略源码错误或允许零测试成功。

## 3. 生产构建与 CI

- [ ] 3.1 接通根 `pnpm build`，执行 contracts 类型检查和两端现有生产构建；验证 Web 生产资源及插件 MV3 manifest 和引用资源存在，不给 contracts 添加空 build 或无必要的 bundle。
- [ ] 3.2 实现 GitHub Actions push/PR 工作流，固定 Node/pnpm 与经官方支持核对的 Action 版本，冻结安装后执行根 typecheck/test/build 和 Web lint；检查工作流语法、触发条件、权限及失败传播，不使用私密凭据、continue-on-error 或历史生成产物。

## 4. 集成验收与失败证明

- [ ] 4.1 在无 node_modules、dist、`.plasmo` 和构建缓存的隔离副本，按 CI 顺序执行冻结安装与全部检查；记录环境版本、命令和退出码，确认无需业务凭据，保留用户工作区已有内容。
- [ ] 4.2 在隔离副本分别向三个工作区注入类型错误，验证每次根 `pnpm typecheck` 非零退出并定位目标文件；记录证据，不保留故障源码。
- [ ] 4.3 分别制造矛盾类型断言与零测试发现，验证两种情况下根 `pnpm test` 均非零退出且原因正确；恢复正常测试后确认通过。
- [ ] 4.4 分别制造 Web/插件无法解析的生产导入，验证根 `pnpm build` 对两端失败均非零退出；另在隔离副本制造清单/锁文件不一致并验证冻结安装失败，保留对应诊断。
- [ ] 4.5 移除仅由本任务创建的故障内容后重跑正常检查链并复核变更范围；验证没有业务功能、权限调整、占位测试或吞错脚本，分别记录本地结果与远端 CI 是否实际执行。

## 5. 文档与交付

- [ ] 5.1 按实际能力更新根及两端 AGENTS、docs/DEVELOPMENT.md 和 docs/PRODUCT.md 的 S0；核对命令可运行、覆盖限制清晰、验收证据齐全，不将静态契约测试表述为业务测试或将未运行的远端 CI 标为成功。
- [ ] 5.2 对照本 change specs 核验全部场景与证据，执行 `openspec validate establish-engineering-checks --strict`；仅勾选实际完成任务，交付剩余限制，不自动归档或开始业务 change。
