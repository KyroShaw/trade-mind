# SPEC: market-research — 行情调研

> 状态：READY | 版本：v0.1

---

## 功能范围

- 展示 AI 汇总的热门板块列表及板块龙头
- 展示宏观/加密市场热点消息（带 AI 摘要）
- 标签筛选消息，手动刷新

## 路由

| 路径 | 组件 | 保护级别 |
|---|---|---|
| / | MarketResearchPage | 公开（未登录可查看，AI 摘要需登录） |

## 数据库

`sectors`（板块 + 热度分）+ `sector_coins`（龙头）+ `news_items`（消息 + AI 摘要）

## tRPC 接口

```
marketRouter.getSectors() → Sector[]               // 含 top 3 龙头
marketRouter.getNews({ tags?, page? }) → NewsItem[] // 分页，每页 20 条
marketRouter.refreshSectors() → void               // 手动触发（防抖 30min）
```

## 外部依赖

- CoinGecko API：`/coins/categories`（板块 + 龙头）
- CryptoPanic API：`/api/v1/posts/`（宏观消息）
- Claude API：批量生成 AI 热度分和消息摘要

## 定时任务

- Cron 每 30 分钟刷新板块和消息数据
- `news_items` 保留最近 7 天，定期清理

## 验收标准

- AC-002-1：展示 ≥ 5 个热门板块，每板块 ≥ 1 个龙头
- AC-002-2：数据标注更新时间
- AC-002-3：刷新周期 ≤ 30 分钟
- AC-003-1：每日展示 ≥ 10 条有效消息
- AC-003-2：每条消息附带 AI 影响摘要
- AC-003-3：支持按标签筛选

## 新增 UI 组件

- `packages/ui/src/components/tabs.tsx`
- `packages/ui/src/components/badge.tsx`（与 alpha-tracker 共用）

## 禁止修改范围

- `packages/db` 中其他模块的 schema 文件
