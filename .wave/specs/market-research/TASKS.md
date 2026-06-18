# TASKS: market-research — 行情调研

> 状态：READY

---

## MARKET-001：数据库 schema — sectors + news_items 表

- **任务类型**：feature
- **执行角色**：database-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：可与 ORDER-001 并行
- **依赖**：AUTH-001

**范围**：
- `packages/db/src/schema/market.ts`：sectors、sector_coins、news_items 表
- 生成并运行 migration

**验收标准**：
- [ ] 3 张表字段完整
- [ ] `pnpm db:push` 成功

---

## MARKET-002：后端 — 外部数据集成 + Cron + tRPC router

- **任务类型**：feature
- **执行角色**：backend-engineer
- **风险等级**：medium（外部 API 依赖）
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：MARKET-001

**范围**：
- 实现 CoinGecko API 板块数据拉取（`/coins/categories`）
- 实现 CryptoPanic API 消息拉取（`/api/v1/posts/`）
- Claude API 批量生成 AI 热度分和消息摘要
- Cron 任务（每 30 分钟）
- 实现 `marketRouter`（getSectors、getNews、refreshSectors）

**验收标准**：
- [ ] Cron 任务成功写入板块和消息数据
- [ ] `getSectors` 返回 ≥ 5 个板块，每板块 ≥ 1 龙头
- [ ] `getNews` 返回 ≥ 10 条消息，每条含 aiSummary
- [ ] 7 天历史数据自动清理
- [ ] 外部 API 失败时使用上次缓存数据（不中断服务）

---

## MARKET-003：前端 — 行情调研首页

- **任务类型**：feature
- **执行角色**：frontend-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：MARKET-002、APP-SHELL-001

**范围**：
- 实现 `/` 首页（参照 `market-research/UI.md`）
- 板块热力 Tab + 宏观消息 Tab（使用新增 Tabs 组件）
- 标签筛选、手动刷新、分页

**验收标准**：
- [ ] 板块 Tab 展示 ≥ 5 个板块，可展开龙头
- [ ] 消息 Tab 展示 ≥ 10 条消息，支持标签筛选
- [ ] 数据更新时间标注正确
- [ ] 未登录可查看列表（AI 摘要可见）

**验证命令**：
```bash
pnpm dev:web
pnpm check-types
```
