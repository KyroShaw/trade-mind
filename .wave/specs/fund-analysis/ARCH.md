# ARCH: fund-analysis — 资金曲线分析

> 状态：READY | 技术栈：tRPC + Drizzle + PostgreSQL + Claude API

---

## 模块边界

- **前端**：`apps/web` — 资金曲线分析页
- **后端**：`apps/server` — tRPC analysis router
- **数据库**：`packages/db` — alert_settings 表（复用 orders 表数据）
- **数据依赖**：order-review 的 `orders` 表

---

## 数据模型

```ts
// packages/db/src/schema/analysis.ts
alert_settings: {
  id: uuid PK
  userId: uuid FK → users.id UNIQUE
  lossStreakThreshold: integer DEFAULT 3  // 连续亏损触发阈值
  winStreakThreshold: integer DEFAULT 5   // 连续盈利触发阈值
  updatedAt: timestamp
}
```

> 盈亏曲线数据直接从 `orders` 表计算，不单独存储。

---

## API（tRPC）

```ts
// packages/api/src/routers/analysis.ts
analysisRouter = {
  getCurve(input: { granularity: 'day' | 'week' }): CurvePoint[]
  // CurvePoint: { date, dailyPnl, cumulativePnl }

  getSummary(): { totalPnl, winRate, avgPnlRatio }

  getAlert(): AlertStatus
  // AlertStatus: { triggered, type: 'loss'|'win'|null, streakCount, aiAnalysis }

  updateAlertSettings(input: { lossThreshold: number; winThreshold: number }): void
}
```

---

## 连续亏损/盈利检测逻辑

```
// 查询用户最近 N 笔已平仓订单（按 closedAt DESC）
// 检测连续 pnl < 0 的笔数 vs lossStreakThreshold
// 检测连续 pnl > 0 的笔数 vs winStreakThreshold
// 触发时调用 Claude API 生成 aiAnalysis（基于近期订单摘要）
// 结果缓存 1 小时（避免重复调用 AI）
```

---

## AI 风险分析

- 调用：Claude API（`claude-haiku-4-5-20251001`）
- 输入：近 10 笔订单摘要（symbol、pnl、duration）
- 输出：`{ pattern: string, suggestion: string }`（< 200 字）
- 缓存：结果存入 Redis 或内存缓存 1 小时（MVP 可用内存缓存）

---

## 跨模块契约

- 直接读取 `orders` 表（`userId + pnl + closedAt`），不经过 order-review tRPC
- `alert_settings` 通过 `userId` 与 auth 模块关联
- 前端通过 TanStack Query `useQuery(trpc.analysis.getAlert)` 轮询（每分钟），或通过页面进入时触发
