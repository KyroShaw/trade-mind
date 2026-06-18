# SPEC: alpha-tracker — Alpha 项目跟踪

> 状态：READY | 版本：v0.1

---

## 功能范围

- 每日抓取 Binance Alpha 项目列表
- 自动标记底部盘整候选（30 日跌幅 > 30% 且 7 日波动 < 10%）
- 用户可为项目添加/移除"定投关注"
- "我的关注"Tab

## 路由

| 路径 | 组件 | 保护级别 |
|---|---|---|
| /alpha | AlphaPage | 公开（关注功能需登录） |

## 数据库

`alpha_projects`（项目 + 底部盘整标记）+ `user_watchlist`（用户关注记录）

## tRPC 接口

```
alphaRouter.list({ filter?: 'all'|'bottom' }) → AlphaProject[]
alphaRouter.getWatchlist() → AlphaProject[]        // 需登录
alphaRouter.addToWatchlist({ projectId }) → void   // 需登录
alphaRouter.removeFromWatchlist({ projectId }) → void // 需登录
```

## 外部依赖

- Binance Alpha 页面抓取（[假设 A1]，HTTP 请求解析 JSON，每日 Cron 00:00 UTC）

## 底部盘整规则

```
isBottomConsolidation = change30dPercent < -30 AND volatility7d < 10
volatility7d = (max7dPrice - min7dPrice) / min7dPrice * 100
```

规则对用户透明，UI 中 Tooltip 展示。

## 验收标准

- AC-004-1：项目列表每日自动更新
- AC-004-2：底部盘整标记展示判断依据
- AC-004-3：用户可添加/移除关注

## 新增 UI 组件

- `packages/ui/src/components/tooltip.tsx`
- `packages/ui/src/components/tabs.tsx`（与 market-research 共用）
- `packages/ui/src/components/badge.tsx`（共用）

## 禁止修改范围

- `packages/db` 中其他模块的 schema 文件
