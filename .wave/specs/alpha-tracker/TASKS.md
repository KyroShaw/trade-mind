# TASKS: alpha-tracker — Alpha 项目跟踪

> 状态：READY

---

## ALPHA-001：数据库 schema — alpha_projects + user_watchlist 表

- **任务类型**：feature
- **执行角色**：database-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：可与 ORDER-001、MARKET-001 并行
- **依赖**：AUTH-001

**范围**：
- `packages/db/src/schema/alpha.ts`：alpha_projects、user_watchlist 表
- 生成并运行 migration

**验收标准**：
- [ ] `alpha_projects` 含 isBottomConsolidation 字段
- [ ] `user_watchlist` 有 UNIQUE(userId, projectId) 约束
- [ ] `pnpm db:push` 成功

---

## ALPHA-002：后端 — Binance Alpha 数据抓取 + Cron + tRPC router

- **任务类型**：feature
- **执行角色**：backend-engineer
- **风险等级**：medium（抓取策略可能变化）
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：ALPHA-001

**范围**：
- 实现 Binance Alpha 数据抓取（HTTP 请求 + JSON 解析）
- 底部盘整计算（`change30d < -30 AND volatility7d < 10`）
- Cron 任务（每日 00:00 UTC）
- 实现 `alphaRouter`（list、getWatchlist、addToWatchlist、removeFromWatchlist）

**验收标准**：
- [ ] Cron 每日成功更新项目列表
- [ ] `isBottomConsolidation` 计算结果与规则一致
- [ ] `addToWatchlist` 需登录，未登录时返回认证错误
- [ ] `list` 支持 `filter: 'bottom'` 筛选

---

## ALPHA-003：前端 — Alpha 项目列表页

- **任务类型**：feature
- **执行角色**：frontend-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：可与 MARKET-003 并行
- **依赖**：ALPHA-002、APP-SHELL-001

**范围**：
- 实现 `/alpha` 页面（参照 `alpha-tracker/UI.md`）
- 全部项目 Tab + 我的关注 Tab
- 底部候选 Badge + Tooltip 展示判断依据

**验收标准**：
- [ ] 项目列表完整展示（价格、7d/30d 涨跌）
- [ ] 底部候选 Badge 正确标记，Tooltip 展示规则数据
- [ ] 未登录点击"定投关注"提示登录
- [ ] 已登录时关注/取消关注即时更新
- [ ] "我的关注" Tab 展示用户已关注列表

**验证命令**：
```bash
pnpm dev:web
pnpm check-types
```
