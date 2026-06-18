# SPEC: fund-analysis — 资金曲线分析

> 状态：READY | 版本：v0.1

---

## 功能范围

- 基于已平仓订单计算并展示累计盈亏曲线（按天/按周）
- 统计摘要：总盈亏、胜率、平均盈亏比
- 检测连续亏损/盈利，触发 AI 风险预警
- 用户自定义预警阈值（2-10 笔）

## 路由

| 路径 | 组件 | 保护级别 |
|---|---|---|
| /analysis | FundAnalysisPage | 需登录 + API Key 绑定 |

## 数据库

`alert_settings`（预警阈值，每用户一条）；曲线数据实时从 `orders` 表计算

## tRPC 接口

```
analysisRouter.getCurve({ granularity: 'day'|'week' }) → CurvePoint[]
analysisRouter.getSummary() → { totalPnl, winRate, avgPnlRatio }
analysisRouter.getAlert() → { triggered, type, streakCount, aiAnalysis }
analysisRouter.updateAlertSettings({ lossThreshold, winThreshold }) → void
```

## 外部依赖

- `orders` 表（由 order-review 模块维护，直接读，不经过 tRPC）
- Claude API：`claude-haiku-4-5-20251001`，生成 aiAnalysis（< 200 字），结果内存缓存 1 小时

## 图表

- 折线图：Recharts `<LineChart>`（需在 `apps/web` 中引入）
- x 轴：日期，y 轴：累计盈亏（USDT）

## 验收标准

- AC-006-1：按天/周切换盈亏曲线
- AC-006-2：连续亏损 ≥ 阈值时展示红色预警横幅
- AC-006-3：预警含近期模式分析和建议
- AC-006-4：阈值设置范围 2-10 笔，保存后立即生效

## 新增依赖

- `recharts`（`apps/web` 中引入）

## 禁止修改范围

- `orders` 表 schema（由 order-review 模块所有）
- `packages/db` 中其他模块的 schema 文件
