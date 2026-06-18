# MODULE: fund-analysis — 资金曲线分析

> PRD 来源：F-006 | 优先级：P1 | 状态：MISSING

## 业务职责

基于订单数据可视化盈亏曲线，检测异常模式触发 AI 风险预警。

## 边界

- **包含**：盈亏曲线图表、连续亏损/盈利检测、AI 预警提示、阈值设置
- **不含**：账户余额管理

## 依赖

- 上游：auth（用户登录后访问）
- 数据依赖：order-review（已平仓订单数据）
- 下游消费者：无

## 关键验收标准（来自 PRD）

- AC-006-1：曲线按天/周可切换视图
- AC-006-2：连续亏损 3 笔后在页面顶部展示预警横幅
- AC-006-3：预警信息包含近期交易模式分析和操作建议
- AC-006-4：用户可在设置中调整触发阈值（2-10 笔）

## 阶段状态

| 阶段 | 状态 | 文件 |
|---|---|---|
| Design | MISSING | DESIGN.md |
| UI | MISSING | UI.md |
| Arch | MISSING | ARCH.md |
| Spec | MISSING | SPEC.md |
| Tasks | MISSING | TASKS.md |
