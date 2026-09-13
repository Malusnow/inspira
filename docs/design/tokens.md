# Design Token 参考

## 可追溯原型值

| 角色              | 原型值                        | 来源与定位                                                        |
| ----------------- | ----------------------------- | ----------------------------------------------------------------- |
| 浅色页面背景      | #F7F6F2                       | [All](prototypes/inspira-all.html) body；Insights 同值            |
| 浅色正文          | #20201E                       | All body                                                          |
| 次级文字          | #777570                       | All .nav-menu-btn                                                 |
| 弱化文字          | #A09B94                       | All .search-trigger                                               |
| 浅色输入背景      | #EDECE8                       | [Insights](prototypes/inspira-insights-settings.html) .search-box |
| 强调主色          | #6C63FF                       | Insights .btn-add                                                 |
| 深色页面背景/正文 | #171818 / #EEEAE3             | prototype-shell.css `:root[data-theme="dark"]` --canvas / --ink   |
| 字体栈            | Inter，系统 sans-serif 回退   | All body                                                          |
| 顶栏高度          | 64px                          | All .top-nav                                                      |
| 页面横向间距      | 36px（All），40px（Insights） | 两原型 .top-nav；存在差异，不能宣称统一值                         |
| 按钮圆角/搜索圆角 | 10px / 14px                   | All .nav-menu-btn / .search-trigger                               |

## 建议映射

正式主题使用语义角色（页面/表面/正文/次级正文/边框/强调/反馈），不要跨组件散布原型十六进制值。Web 私有应用当前由 `apps/web/src/lib/theme/colorScale.ts` 根据主色生成浅到深十色色阶，并通过 `apps/web/src/lib/theme/themeTokens.ts` 映射到 TDesign 主色色阶、关键背景/文字/边框变量和 Web CSS 语义 Token。ECharts 通过 `apps/web/src/lib/theme/echartsTheme.ts` 使用同一主题来源。

`themeTokens.ts` 把品牌色拆成两个角色——填充用原始主色 `--color-brand`，文字用 `--color-brand-ink`（悬停 `--color-brand-ink-hover`）。文字主色以当前模式表面色为基准，必要时把主色朝该模式墨色调制，直到满足 WCAG AA 4.5:1；组件文字统一走 `text-brand-ink`，TDesign 的 `--td-text-color-brand` / `--td-text-color-link` 也指向同一取值。

状态色不应仅靠主色深浅表达成功/错误。

## 后续验证

主题变化应同时影响组件与图表，不能只修改页面背景。
