# TASKS: order-review — 订单复盘

> 状态：READY

---

## ORDER-001：数据库 schema — orders + order_reviews 表

- **任务类型**：feature
- **执行角色**：database-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：AUTH-001

**范围**：
- `packages/db/src/schema/orders.ts`：orders + order_reviews 表
- 生成并运行 migration

**验收标准**：
- [ ] `orders` 表含完整字段（binanceOrderId、symbol、side、entryPrice、exitPrice、pnl、等）
- [ ] `order_reviews` 表含 orderId（UNIQUE FK）、entryLogic、exitLogic、aiReport
- [ ] `pnpm db:push` 成功

---

## ORDER-002：后端 — Binance 订单同步 tRPC router

- **任务类型**：feature
- **执行角色**：backend-engineer
- **风险等级**：medium
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：ORDER-001、AUTH-002

**范围**：
- 实现 `packages/api/src/routers/orders.ts`（sync、list、get）
- `sync`：解密 API Key，调用 `GET /api/v3/myTrades`，增量写入 DB
- 处理 Binance 速率限制（weight 监控）

**验收标准**：
- [ ] `sync` 成功拉取近 90 天订单并写入 DB
- [ ] 重复执行 `sync` 不产生重复记录（upsert by binanceOrderId）
- [ ] Binance API 失败时返回错误信息（不抛未处理异常）
- [ ] `list` 支持 symbol/dateRange/side 筛选

---

## ORDER-003：后端 — AI 复盘报告生成

- **任务类型**：feature
- **执行角色**：backend-engineer
- **风险等级**：medium（Claude API 延迟/费用）
- **QA 策略**：required
- **并行策略**：可与 ORDER-002 并行
- **依赖**：ORDER-001

**范围**：
- 实现 `ordersRouter.generateReview` 和 `exportReview`
- Claude API 调用：`claude-haiku-4-5-20251001`，生成 3 维度报告
- 结果存入 `order_reviews.aiReport`（Markdown）

**验收标准**：
- [ ] 提交逻辑后 ≤ 30s 返回报告
- [ ] 报告 Markdown 包含执行质量、风险控制、改进建议 3 个 Section
- [ ] Claude API 超时时返回友好错误（不泄露 API Key）
- [ ] `exportReview` 返回可用的 Markdown 字符串

---

## ORDER-004：前端 — 订单列表页

- **任务类型**：feature
- **执行角色**：frontend-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：可与 ORDER-003 并行
- **依赖**：ORDER-002、APP-SHELL-001

**范围**：
- 实现 `/orders` 页面（参照 `order-review/UI.md`）
- 调用 `trpc.orders.sync`（首次进入自动触发）和 `trpc.orders.list`
- 筛选栏（交易对/时间/盈亏）+ 分页

**验收标准**：
- [ ] 首次进入自动同步订单
- [ ] 列表展示盈亏（绿/红）+ "已复盘"Badge
- [ ] 筛选功能生效
- [ ] 无订单时展示空状态

---

## ORDER-005：前端 — 订单详情 + 复盘页

- **任务类型**：feature
- **执行角色**：frontend-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：ORDER-003、ORDER-004、APP-SHELL-001

**范围**：
- 实现 `/orders/:orderId` 页面（参照 `order-review/UI.md`）
- 逻辑输入 + 生成复盘按钮 + 报告展示 + 复制/导出

**验收标准**：
- [ ] 订单详情信息完整展示
- [ ] 生成中展示 loading 动效
- [ ] 报告 3 个维度正确渲染（支持 Markdown）
- [ ] 复制按钮将报告复制至剪贴板
- [ ] 导出按钮下载 `.md` 文件

**验证命令**：
```bash
pnpm dev:web
pnpm check-types
```
