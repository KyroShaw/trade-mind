# SPEC: order-review — 订单复盘

> 状态：READY | 版本：v0.1

---

## 功能范围

- 拉取并缓存近 90 天已平仓 Binance 现货订单
- 展示订单列表（可筛选）
- 用户填写开仓/平仓逻辑，触发 AI 复盘报告生成
- 报告导出为 Markdown

## 路由

| 路径 | 组件 | 保护级别 |
|---|---|---|
| /orders | OrdersPage | 需登录 + API Key 绑定 |
| /orders/:orderId | OrderDetailPage | 需登录 + API Key 绑定 |

## 数据库

`orders`（缓存 Binance 订单）+ `order_reviews`（用户逻辑 + AI 报告，一对一）

## tRPC 接口

```
ordersRouter.sync() → { count }                     // 拉取近 90 天
ordersRouter.list({ symbol?, dateRange?, side? }) → Order[]
ordersRouter.get({ orderId }) → OrderWithReview
ordersRouter.generateReview({ orderId, entryLogic?, exitLogic? }) → ReviewReport
ordersRouter.exportReview({ orderId }) → string     // Markdown
```

## 外部依赖

- Binance REST API：`GET /api/v3/myTrades`（只读 Key）
- Claude API：`claude-haiku-4-5-20251001`，生成复盘报告（含执行质量、风险控制、改进建议）

## 验收标准

- AC-005-1：近 90 天订单拉取数量与 Binance 账户一致
- AC-005-2：提交逻辑后 30s 内生成报告
- AC-005-3：报告包含执行质量、风险控制、改进建议 3 个维度
- AC-005-4：导出 Markdown 可正常下载/复制

## 新增 UI 组件

- `packages/ui/src/components/textarea.tsx`
- `packages/ui/src/components/badge.tsx`

## 禁止修改范围

- `packages/db` 中其他模块的 schema 文件
- `packages/auth` 相关配置
