# TASKS: fund-analysis — 资金曲线分析

> 状态：READY

---

## ANALYSIS-001：数据库 schema — alert_settings 表

- **任务类型**：feature
- **执行角色**：database-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：可与其他 DB 任务并行
- **依赖**：AUTH-001

**范围**：
- `packages/db/src/schema/analysis.ts`：alert_settings 表
- 生成并运行 migration

**验收标准**：
- [ ] `alert_settings` 含 userId（UNIQUE）、lossStreakThreshold（默认 3）、winStreakThreshold（默认 5）
- [ ] `pnpm db:push` 成功

---

## ANALYSIS-002：后端 — 曲线计算 + 预警检测 + tRPC router

- **任务类型**：feature
- **执行角色**：backend-engineer
- **风险等级**：medium（Claude API 调用）
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：ANALYSIS-001、ORDER-001

**范围**：
- 实现 `analysisRouter`（getCurve、getSummary、getAlert、updateAlertSettings）
- `getCurve`：基于 `orders` 表计算每日/每周累计盈亏序列
- `getAlert`：连续亏损/盈利检测 + Claude API 生成 aiAnalysis（内存缓存 1h）
- `updateAlertSettings`：写入 DB，范围限制 2-10

**验收标准**：
- [ ] `getCurve` 返回正确的累计盈亏曲线数据
- [ ] `getAlert` 在连续亏损 ≥ 阈值时返回 `triggered: true` 和 aiAnalysis
- [ ] aiAnalysis 内容 < 200 字，含模式分析和建议
- [ ] `updateAlertSettings` 范围验证（2-10 笔），超出范围报错

---

## ANALYSIS-003：前端 — 资金曲线分析页

- **任务类型**：feature
- **执行角色**：frontend-engineer
- **风险等级**：medium（Recharts 引入）
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：ANALYSIS-002、ORDER-004、APP-SHELL-001

**范围**：
- 实现 `/analysis` 页面（参照 `fund-analysis/UI.md`）
- 引入 Recharts，实现折线图（按天/按周切换）
- 统计摘要 + 预警横幅（条件展示）+ 阈值设置

**验收标准**：
- [ ] 折线图正确显示累计盈亏趋势
- [ ] 按天/按周切换数据正确
- [ ] 触发预警时顶部横幅展示（红/黄色），含 aiAnalysis 内容
- [ ] 阈值设置保存后预警立即使用新阈值
- [ ] 无订单数据时展示空状态引导

**验证命令**：
```bash
pnpm dev:web
pnpm check-types
```
