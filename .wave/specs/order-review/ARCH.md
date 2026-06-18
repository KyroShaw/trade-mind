# ARCH: order-review — 订单复盘

> 状态：READY | 技术栈：tRPC + Drizzle + PostgreSQL + Binance API + Claude API

---

## 模块边界

- **前端**：`apps/web` — 订单列表 + 详情/复盘页
- **后端**：`apps/server` — tRPC orders router + Binance API client
- **数据库**：`packages/db` — orders、order_reviews 表

---

## 数据模型

```ts
// packages/db/src/schema/orders.ts
orders: {
  id: uuid PK
  userId: uuid FK → users.id
  binanceOrderId: text UNIQUE
  symbol: text                // e.g. BTCUSDT
  side: 'BUY' | 'SELL'
  entryPrice: decimal
  exitPrice: decimal
  quantity: decimal
  pnl: decimal
  pnlPercent: decimal
  openedAt: timestamp
  closedAt: timestamp
  syncedAt: timestamp
}

order_reviews: {
  id: uuid PK
  orderId: uuid FK → orders.id UNIQUE
  entryLogic: text           // 用户开仓逻辑
  exitLogic: text            // 用户平仓逻辑
  aiReport: text             // AI 生成的复盘报告（Markdown）
  generatedAt: timestamp
}
```

---

## API（tRPC）

```ts
// packages/api/src/routers/orders.ts
ordersRouter = {
  sync(): SyncResult                                // 拉取并缓存近 90 天已平仓订单
  list(input: { symbol?; dateRange?; side?; }): Order[]
  get(input: { orderId: string }): OrderWithReview
  generateReview(input: { orderId: string; entryLogic?: string; exitLogic?: string }): ReviewReport
  exportReview(input: { orderId: string }): string  // 返回 Markdown 字符串
}
```

---

## Binance API 集成

- 接口：`GET /api/v3/myTrades`（现货）
- 权限：只读（通过 `api_keys` 取解密后 Key）
- 拉取策略：首次全量 90 天，后续增量（按 `closedAt > lastSyncedAt`）
- 速率限制：遵守 Binance 1200 weight/min 限制，按需 sleep

---

## AI 复盘生成

- 调用：Claude API（`claude-haiku-4-5-20251001` 降低成本）
- Prompt 结构：`订单数据 + 用户逻辑 → 返回 JSON {qualityScore, riskScore, suggestions}`
- 超时：30s，超时返回错误提示
- 结果存 `order_reviews.aiReport`（Markdown 格式）

---

## 跨模块契约

- `fund-analysis` 直接读 `orders` 表，不重复调用 Binance API
- 复盘报告通过 `order_reviews.orderId` 一对一关联订单
