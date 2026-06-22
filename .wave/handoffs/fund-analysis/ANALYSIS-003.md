# Handoff: fund-analysis / ANALYSIS-003

- **角色**：frontend-engineer
- **状态**：DONE
- **Git 基线**：13d48a9
- **模块**：fund-analysis
- **TASK-ID**：ANALYSIS-003

## 修改文件

- `apps/web/src/routes/_app/_protected/analysis.tsx`（完整替换占位页面，实现完整功能）
- `apps/web/package.json`（添加 recharts 依赖）
- `pnpm-lock.yaml`（pnpm add 自动更新）

## 执行结果

完成了 `/analysis` 页面的完整前端实现，包含折线图（Recharts）、统计摘要卡片、预警横幅、AI 分析详情卡片和可折叠阈值设置区域。

## 执行命令

1. `pnpm add recharts --filter web` — 安装 Recharts，成功
2. 实现 `apps/web/src/routes/_app/_protected/analysis.tsx`
3. `pnpm dlx ultracite fix apps/web/src/routes/_app/_protected/analysis.tsx` — 格式修复通过（补加 `role="img"` 解决 aria-label lint 错误）
4. `pnpm check-types` — 全部通过，3 successful，0 errors

## 验收标准完成情况

- [x] 折线图正确显示累计盈亏趋势（Recharts LineChart，dataKey="cumulativePnl"，蓝色 #3b82f6）
- [x] 按天/按周切换数据正确（Tabs 切换 granularity state，重新调用 getCurve queryOptions）
- [x] 触发预警时顶部横幅展示（红/黄色），含 aiAnalysis 内容（AlertBanner 组件，loss→destructive，win→warning，含关闭 × 按钮）
- [x] 阈值设置保存后预警立即使用新阈值（mutation onSuccess invalidateQueries getAlert.queryFilter()）
- [x] 无订单数据时展示空状态引导（CurveChart 空数组时渲染 TrendingUp 图标 + 引导文字）

## 关键实现细节

- 预警横幅：`type === 'loss'` 用 `variant="destructive"`；`type === 'win'` 用 `variant="warning"`；点击 × 设置 `alertDismissed` state（不持久化，刷新恢复）
- 折线图 Tooltip：自定义 `CurveTooltip` 显示日期、当日盈亏（dailyPnl）、累计盈亏（cumulativePnl），盈/亏分色
- getAlert 轮询：`refetchInterval: 60_000`
- 阈值设置：默认收起，`expanded` state 控制，Input min=2/max=10，保存后立即 invalidate getAlert
- 可访问性：折线图容器使用 `role="img" aria-label="盈亏趋势折线图"` 通过 Biome a11y lint

## 验证结果

```
pnpm check-types
Tasks: 3 successful, 3 total — 0 type errors
pnpm dlx ultracite fix (单文件): Checked 1 file in 11ms. No fixes applied.
```

注：`pnpm fix` 全局因 `apps/fumadocs/biome.json` 嵌套根配置冲突报错，属预存在问题，与本任务无关。

## 风险

- Recharts bundle 体积：analysis chunk 342 kB（gzip 101 kB），建议后续对该页面进行动态 import() 代码分割
- pnpm fix 全局失败为已有问题，不影响 web 包代码质量

## 建议下一节点

VERIFYING — 可进行 QA 验收（ANALYSIS-003-qa），重点验证折线图渲染、预警横幅触发/关闭、阈值保存后 getAlert 重新触发、空状态展示。
