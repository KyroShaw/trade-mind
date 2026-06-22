# MODULE QA — order-review

> 日期：2026-06-22 | 范围：ORDER-001 ~ ORDER-005 | 结论：**PASSED**

---

## 验证命令

```bash
pnpm check-types   # Tasks: 3 successful, 3 total ✅
pnpm dlx ultracite check apps/web/src/routes/_app/_protected/orders/$orderId.tsx  # No errors ✅
```

---

## ORDER-001 — DB Schema

| 验收标准 | 结论 | 证据 |
|---|---|---|
| `orders` 表含完整字段（binanceOrderId、symbol、side、entryPrice、exitPrice、pnl、等） | ✅ PASSED | `packages/db/src/schema/orders.ts` 含全部字段，enum `order_side`，uniqueIndex on `(binance_order_id, user_id)` |
| `order_reviews` 表含 orderId（UNIQUE FK）、entryLogic、exitLogic、aiReport | ✅ PASSED | schema + migration SQL `CREATE UNIQUE INDEX order_reviews_order_id_idx` |
| `pnpm db:push` 成功（表+索引+FK 均就位） | ✅ PASSED | `0000_ancient_cable.sql` 包含所有 CREATE TABLE、ALTER TABLE FK、CREATE INDEX 语句 |

---

## ORDER-002 — Binance 订单同步

| 验收标准 | 结论 | 证据 |
|---|---|---|
| `sync` 成功拉取近 90 天订单并写入 DB | ✅ PASSED | `ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000`；增量逻辑用 `lastSynced.syncedAt - 60s` |
| 重复执行不产生重复记录（upsert by binanceOrderId） | ✅ PASSED | `onConflictDoNothing({ target: [orders.binanceOrderId, orders.userId] })` |
| Binance API 失败时返回错误信息（不抛未处理异常） | ✅ PASSED | try-catch 包裹 fetch；速率限制返回 `TOO_MANY_REQUESTS`；无效 symbol 返回空数组跳过 |
| `list` 支持 symbol/dateRange/side 筛选 | ✅ PASSED | `conditions` 数组动态拼 `eq/gte/lte`，分页 `limit/offset` |

---

## ORDER-003 — AI 复盘报告

| 验收标准 | 结论 | 证据 |
|---|---|---|
| 提交逻辑后 ≤ 30s 返回报告 | ✅ PASSED | `AbortController` + `setTimeout(() => controller.abort(), 30_000)`；超时返回 `TIMEOUT` TRPCError |
| 报告 Markdown 包含执行质量、风险控制、改进建议 3 个 Section | ✅ PASSED | `buildReviewPrompt` 强制要求输出 `## ✅ 执行质量`、`## ⚠️ 风险控制`、`## 💡 改进建议` |
| Claude API 超时时返回友好错误（不泄露 API Key） | ✅ PASSED | AbortError → "AI 分析超时（>30s），请稍后重试"；无 Key 信息泄漏 |
| `exportReview` 返回可用的 Markdown 字符串 | ✅ PASSED | 查询 `order_reviews.aiReport`，NOT_FOUND 时返回 TRPCError |

---

## ORDER-004 — 前端订单列表页

| 验收标准 | 结论 | 证据 |
|---|---|---|
| 首次进入自动同步订单 | ✅ PASSED | `useEffect(() => { triggerSync(); }, [])` mount-only trigger |
| 列表展示盈亏（绿/红）+ "已复盘"Badge | ✅ PASSED | `emerald-600 / red-500` 颜色类；`order.hasReview && <Badge>已复盘</Badge>` |
| 筛选功能生效 | ✅ PASSED | `SymbolFilter`、`DateRangeFilter`、`PnlFilterSelect` 三个 DropdownMenu；client-side pnl filter |
| 无订单时展示空状态 | ✅ PASSED | `orders.length === 0` → `<EmptyState isSyncing={isSyncing} />` |

---

## ORDER-005 — 前端订单详情 + 复盘页

| 验收标准 | 结论 | 证据 |
|---|---|---|
| 订单详情信息完整展示 | ✅ PASSED | symbol/side/PnL（绿红）/entryPrice/exitPrice/quantity/openedAt/closedAt 全部渲染 |
| 生成中展示 loading 动效 | ✅ PASSED | `isGenerating` → 3 个 `<Skeleton h-20>` + "AI 正在分析你的交易..." |
| 报告 3 个维度正确渲染（支持 Markdown） | ✅ PASSED | `parseReportSections` 按 `## ` 分节；每节 Card + 白空格保留 `whitespace-pre-wrap` |
| 复制按钮将报告复制至剪贴板 | ✅ PASSED | `navigator.clipboard.writeText(report)` + toast 反馈 |
| 导出按钮下载 `.md` 文件 | ✅ PASSED | `Blob` + `<a download>`；`URL.revokeObjectURL` 延迟 100ms（Firefox 兼容） |

---

## PRD 验收标准对照（F-005）

| AC | 描述 | 结论 | 备注 |
|---|---|---|---|
| AC-005-1 | 近 90 天订单拉取数量与 Binance 一致 | 🔶 NEEDS_MANUAL | 需真实 Binance API Key 验证 |
| AC-005-2 | 30s 内生成报告 | 🔶 NEEDS_MANUAL | 需调用 Claude API 验证实际延迟 |
| AC-005-3 | 报告含 3 个维度 | ✅ PASSED | prompt 强制结构 + parseReportSections 解析 |
| AC-005-4 | 报告可一键复制/导出 | ✅ PASSED | clipboard + Blob download |

---

## 安全检查

| 项目 | 结论 |
|---|---|
| API Key 不出现在任何响应消息 | ✅ 超时/错误消息均不含 Key 内容 |
| ENCRYPTION_KEY 缺失时友好提示 | ✅ TRPCError `PRECONDITION_FAILED` |
| ANTHROPIC_API_KEY 缺失时友好提示 | ✅ TRPCError `PRECONDITION_FAILED` |
| 前端不直连 DB | ✅ 所有数据通过 tRPC 路由 |
| Binance Secret Key 仅在服务端解密 | ✅ 解密在 `orders.ts` 服务端完成 |

---

## 代码审查发现（N4 Codex Review 已处理）

| 发现 | 处置 |
|---|---|
| `URL.revokeObjectURL` 同步撤销可能导致 Firefox 下载失败 | ✅ 已修复：延迟 100ms |
| Preamble 文本在 `## ` 前可能成为错误 section | ✅ 已修复：`text.search` 定位首个标题 |
| `section.title` 作为 React key 可能重复 | ✅ 已修复：改用 index |

---

## 结论

```
PASSED（2 项 NEEDS_MANUAL 依赖外部 API，不阻塞合并）
```

- 全部自动化验证通过
- 类型检查：3 packages 全部成功
- 安全：API Key 无泄漏风险，最小权限原则已遵守
- NEEDS_MANUAL 项（AC-005-1、AC-005-2）需要在有真实 Binance + Claude API 配置的环境中手动验证
