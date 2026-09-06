# Inspira Docs

## 阅读入口

| 任务                     | 先读                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| 任意任务                 | [AGENTS](../AGENTS.md)、当前 OpenSpec change                       |
| 产品行为或模块拆分       | [Product](PRODUCT.md)                                              |
| 架构、后端、数据边界     | [Architecture](ARCHITECTURE.md)                                    |
| 接口、采集、媒体上传访问 | [Contracts](CONTRACTS.md)                                          |
| 启动、测试、CI、验收     | [Development](DEVELOPMENT.md)                                      |
| Web UI                   | [Design](design/README.md) 和对应原型                              |
| Chrome 插件              | [Contracts](CONTRACTS.md)、[插件规则](../apps/extension/AGENTS.md) |

## 文档职责

- `AGENTS.md`：AI 协作规则和阅读路由，不写详细产品说明。
- `PRODUCT.md`：已确认产品范围、待确认问题、模块实现顺序。
- `ARCHITECTURE.md`：系统结构、数据流、权限边界。
- `CONTRACTS.md`：共享数据、采集、媒体接口契约。
- `DEVELOPMENT.md`：运行命令、验证规则、环境配置。
- `design/`：视觉和交互参考，原型不是业务实现。
- `openspec/changes/`：单次变更的 proposal、spec、design、tasks。

新增文档前先判断是否能放进以上文件。避免同一事实多处维护。
