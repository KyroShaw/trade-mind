# MODULE: order-review — 订单复盘

> PRD 来源：F-005 | 优先级：P0 | 状态：MISSING

## 业务职责

拉取 Binance 已平仓订单，接收用户交易逻辑输入，生成 AI 复盘诊断报告。

## 边界

- **包含**：订单列表、逻辑输入、AI 复盘报告、导出功能
- **不含**：自动下单、实时行情

## 依赖

- 上游：auth（需要 Binance API Key）
- 下游消费者：fund-analysis（提供已平仓订单数据）

## 关键验收标准（来自 PRD）

- AC-005-1：成功拉取近 90 天订单，数量与 Binance 一致
- AC-005-2：用户提交逻辑后 30 秒内生成复盘报告
- AC-005-3：复盘报告包含至少 3 个维度（执行质量、风险控制、改进建议）
- AC-005-4：报告可一键复制/导出

## 阶段状态

| 阶段 | 状态 | 文件 |
|---|---|---|
| Design | MISSING | DESIGN.md |
| UI | MISSING | UI.md |
| Arch | MISSING | ARCH.md |
| Spec | MISSING | SPEC.md |
| Tasks | MISSING | TASKS.md |
