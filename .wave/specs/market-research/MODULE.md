# MODULE: market-research — 行情调研

> PRD 来源：F-002, F-003 | 优先级：P1 | 状态：MISSING

## 业务职责

展示热门板块轮动信息和宏观市场消息简报（AI 驱动）。

## 边界

- **包含**：板块列表、板块龙头、宏观消息列表、AI 影响摘要
- **不含**：用户个人数据、订单数据

## 依赖

- 上游：auth（用户登录后访问）
- 下游消费者：无

## 关键验收标准（来自 PRD）

- AC-002-1：首页展示至少 5 个热门板块，每板块至少 1 个龙头
- AC-002-2：数据标注更新时间
- AC-002-3：刷新周期 ≤ 30 分钟
- AC-003-1：每日至少展示 10 条有效消息
- AC-003-2：每条消息附带 AI 影响摘要
- AC-003-3：支持按标签筛选

## 阶段状态

| 阶段 | 状态 | 文件 |
|---|---|---|
| Design | MISSING | DESIGN.md |
| UI | MISSING | UI.md |
| Arch | MISSING | ARCH.md |
| Spec | MISSING | SPEC.md |
| Tasks | MISSING | TASKS.md |
