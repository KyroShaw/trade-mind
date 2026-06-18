# ARCH: market-research — 行情调研

> 状态：READY | 技术栈：tRPC + Drizzle + PostgreSQL + 外部 API + Claude API

---

## 模块边界

- **前端**：`apps/web` — 首页行情调研页
- **后端**：`apps/server` — tRPC market router + 定时刷新任务
- **数据库**：`packages/db` — sectors、sector_coins、news_items 表

---

## 数据模型

```ts
// packages/db/src/schema/market.ts
sectors: {
  id: uuid PK
  name: text                // e.g. "DeFi"
  heatScore: integer        // AI 计算热度分（0-100）
  dailyChangePercent: decimal
  updatedAt: timestamp
}

sector_coins: {
  id: uuid PK
  sectorId: uuid FK → sectors.id
  symbol: text
  price: decimal
  change24hPercent: decimal
  rank: integer
  updatedAt: timestamp
}

news_items: {
  id: uuid PK
  externalId: text UNIQUE   // CryptoPanic item id
  title: text
  url: text
  source: text
  tags: text[]              // ['macro', 'regulation', 'market']
  aiSummary: text           // AI 影响摘要（一句话）
  publishedAt: timestamp
  createdAt: timestamp
}
```

---

## API（tRPC）

```ts
// packages/api/src/routers/market.ts
marketRouter = {
  getSectors(): Sector[]                           // 含 top 3 龙头
  getNews(input: { tags?; page?; }): NewsItem[]    // 分页，默认 page=1 size=20
  refreshSectors(): void                           // 手动触发刷新（防抖 30min）
}
```

---

## 数据来源与刷新

**板块热力：**
- 数据源：CoinGecko API（`/coins/categories`）或 CoinMarketCap API
- AI 热度评分：Claude API 批量计算（基于价格变化、搜索量等维度）
- 刷新：Cron 每 30 分钟（`node-cron` 或 Hono 定时任务）

**宏观消息：**
- 数据源：CryptoPanic API（免费 tier，`/api/v1/posts/`）
- AI 摘要：Claude API 批量生成（每条消息调用一次，缓存结果）
- 刷新：Cron 每 30 分钟

---

## 性能

- 数据全部缓存在 PostgreSQL，前端只查 DB 不调外部 API
- 外部 API 调用仅在 Cron 任务中执行
- `news_items` 保留最近 7 天记录，定期清理

---

## 跨模块契约

- market-research 不依赖其他业务模块
- 前端 `useQuery(trpc.market.getSectors)` 每 30min 自动重新 fetch（TanStack Query staleTime）
