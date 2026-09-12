# Design Token 参考

> 状态：从现有原型 CSS 提取的视觉参考；Web 私有应用已接入本地主题偏好、主色输入和十色色阶生成。跨端同步、Insights/ECharts 接入和词云最终参数仍以对应 change 为准。

## 可追溯原型值

| 角色              | 原型值                            | 来源与定位                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------- |
| 浅色页面背景      | #F7F6F2                           | [All](prototypes/inspira-all.html) body；Insights 同值    |
| 浅色正文          | #20201E                           | All body                                                      |
| 次级文字          | #777570                           | All .nav-menu-btn                                             |
| 弱化文字          | #A09B94                           | All .search-trigger                                           |
| 浅色输入背景      | #EDECE8                           | [Insights](prototypes/inspira-insights-settings.html) .search-box |
| 强调主色          | #6C63FF                           | Insights .btn-add                                                 |
| 深色背景/正文     | #0E0E0E / #E5E4E0                 | [Explore](prototypes/inspira-explore.html) body           |
| 字体栈            | Inter，系统 sans-serif 回退       | All / Explore body                                        |
| 顶栏高度          | 64px                              | All .top-nav                                                  |
| 页面横向间距      | 36px（All），40px（Insights） | 两原型 .top-nav；存在差异，不能宣称统一值                         |
| 按钮圆角/搜索圆角 | 10px / 14px                       | All .nav-menu-btn / .search-trigger                           |
| 标签字号          | 22px / 16px / 13px                | Explore .tag-node.size-l/m/s，静态演示                        |
| 标签间距          | padding 8px 16px                  | Explore .tag-node                                             |
| 标签明度          | 浅文字 alpha .5/.4/.25            | Explore 大/中/小词；低对比需重新验证                          |

## 建议映射

正式主题使用语义角色（页面/表面/正文/次级正文/边框/强调/反馈），不要跨组件散布原型十六进制值。Web 私有应用当前由 `apps/web/src/lib/theme/colorScale.ts` 根据主色生成浅到深十色色阶，并通过 `apps/web/src/lib/theme/themeTokens.ts` 映射到 TDesign 主色色阶、关键背景/文字/边框变量和 Web CSS 语义 Token。ECharts 仍待 Insights 接入时使用同一主题来源。

主色不能同时直接充当填充与文字色：过浅的主色在浅色表面、过深的主色在深色表面上都会让文字失去对比度。因此 `themeTokens.ts` 把品牌色拆成两个角色——填充仍用原始主色 `--color-brand`，文字用 `--color-brand-ink`（悬停 `--color-brand-ink-hover`）。文字主色以当前模式表面色为基准，仅在必要时把主色朝该模式墨色调制，直到满足 WCAG AA 4.5:1；组件文字统一走 `text-brand-ink`，TDesign 的 `--td-text-color-brand` / `--td-text-color-link` 也指向同一取值。

状态色不应仅靠主色深浅表达成功/错误。词云按频度分别映射字号、颜色强调和空间优先级；最低频仍应可读、可点击。高频在浅色主题更深，深色主题更亮；不机械地在深色背景上继续加深。

布局稳定、水平排版、漂浮强度和颜色对比阈值为建议；最终参数以视觉验收记录为准。原型的 7–12 秒浮动周期不自动成为产品承诺。

## 后续验证

需要技术验证 T05：两主题、长标签、极端频差、空/单标签、窄屏、减少动画及焦点可见性。主题变化应同时影响组件与图表，不能只修改页面背景。当前 Settings 主题切换已覆盖 TDesign 组件预览与自定义界面 token；图表主题随 Insights 后续实现验证。
