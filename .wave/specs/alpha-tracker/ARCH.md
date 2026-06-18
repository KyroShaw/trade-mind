# ARCH: alpha-tracker — Alpha 项目跟踪

> 状态：READY | 技术栈：tRPC + Drizzle + PostgreSQL + Binance Alpha 数据抓取

---

## 模块边界

- **前端**：`apps/web` — Alpha 项目列表页
- **后端**：`apps/server` — tRPC alpha router + 每日 Cron 任务
- **数据库**：`packages/db` — alpha_projects、user_watchlist 表

---

## 数据模型

```ts
// packages/db/src/schema/alpha.ts
alpha_projects: {
  id: uuid PK
  binanceId: text UNIQUE     // Binance Alpha 项目标识
  name: text
  symbol: text
  price: decimal
  change7dPercent: decimal
  change30dPercent: decimal
  volatility7d: decimal      // 7 日波动率（最高-最低/最低）
  isBottomConsolidation: boolean  // 是否底部盘整候选
  updatedAt: timestamp
}

user_watchlist: {
  id: uuid PK
  userId: uuid FK → users.id
  projectId: uuid FK → alpha_projects.id
  addedAt: timestamp
  UNIQUE(userId, projectId)
}
```

---

## API（tRPC）

```ts
// packages/api/src/routers/alpha.ts
alphaRouter = {
  list(input: { filter?: 'all' | 'bottom' }): AlphaProject[]
  getWatchlist(): AlphaProject[]
  addToWatchlist(input: { projectId: string }): void
  removeFromWatchlist(input: { projectId: string }): void
}
```

---

## 数据抓取策略

- 数据源：Binance Alpha 页面（[假设 A1] 无官方 API，HTTP 请求 + JSON 解析）
- 抓取时机：每日 Cron 00:00 UTC
- 底部盘整计算（在 Cron 任务中）：
  ```
  isBottomConsolidation = change30dPercent < -30 AND volatility7d < 10
  ```

---

## 权限

- 查看列表：无需登录
- 添加/移除关注：需登录（路由守卫 + tRPC context 验证 session）

---

## 跨模块契约

- alpha-tracker 不依赖其他业务模块的数据
- user_watchlist 通过 `userId` 与 auth 模块关联
