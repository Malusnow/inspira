# Design Token 参考

> 状态：从现有原型 CSS 提取的视觉参考；不是已批准的最终 Token API，也没有已实现的主题生成器。主色/十色色阶与词云强调方向已确认，具体数值和命名仍为建议。

## 可追溯原型值

| 角色              | 原型值                            | 来源与定位                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------- |
| 浅色页面背景      | #F7F6F2                           | [Library](prototypes/inspira-library.html) body；Insights 同值    |
| 浅色正文          | #20201E                           | Library body                                                      |
| 次级文字          | #777570                           | Library .nav-menu-btn                                             |
| 弱化文字          | #A09B94                           | Library .search-trigger                                           |
| 浅色输入背景      | #EDECE8                           | [Insights](prototypes/inspira-insights-settings.html) .search-box |
| 强调主色          | #6C63FF                           | Insights .btn-add                                                 |
| 深色背景/正文     | #0E0E0E / #E5E4E0                 | [Serendipity](prototypes/inspira-serendipity.html) body           |
| 字体栈            | Inter，系统 sans-serif 回退       | Library / Serendipity body                                        |
| 顶栏高度          | 64px                              | Library .top-nav                                                  |
| 页面横向间距      | 36px（Library），40px（Insights） | 两原型 .top-nav；存在差异，不能宣称统一值                         |
| 按钮圆角/搜索圆角 | 10px / 14px                       | Library .nav-menu-btn / .search-trigger                           |
| 标签字号          | 22px / 16px / 13px                | Serendipity .tag-node.size-l/m/s，静态演示                        |
| 标签间距          | padding 8px 16px                  | Serendipity .tag-node                                             |
| 标签明度          | 浅文字 alpha .5/.4/.25            | Serendipity 大/中/小词；低对比需重新验证                          |

## 建议映射

正式主题使用语义角色（页面/表面/正文/次级正文/边框/强调/反馈），不要跨组件散布原型十六进制值。主色输入经纯函数生成十色色阶，再映射到 TDesign、ECharts 与 Web CSS 语义 Token；算法及实际 CSS 名称由主题切片核实，不在此编造已存在的变量。

状态色不应仅靠主色深浅表达成功/错误。词云按频度分别映射字号、颜色强调和空间优先级；最低频仍应可读、可点击。高频在浅色主题更深，深色主题更亮；不机械地在深色背景上继续加深。

布局稳定、水平排版、漂浮强度和颜色对比阈值为建议；最终参数以视觉验收记录为准。原型的 7–12 秒浮动周期不自动成为产品承诺。

## 后续验证

需要技术验证 T05：两主题、长标签、极端频差、空/单标签、窄屏、减少动画及焦点可见性。主题变化应同时影响组件与图表，不能只修改页面背景。当前无固定视口截图基线，不能把原型 CSS 提取视为浏览器验证通过。
