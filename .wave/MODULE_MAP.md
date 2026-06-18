# MODULE_MAP.md — 模块地图

> 版本：v0.1（INIT）｜生成日期：2026-06-19
> 状态：READY

---

## 模块列表

| ID | 模块名称 | 业务域 | 优先级 | PRD 功能 | 依赖 | 状态 |
|---|---|---|---|---|---|---|
| auth | 账号与 API 绑定 | 用户身份 | P0 | F-001 | — | MISSING |
| market-research | 行情调研 | 市场信息 | P1 | F-002, F-003 | auth | MISSING |
| alpha-tracker | Alpha 项目跟踪 | 市场信息 | P1 | F-004 | auth | MISSING |
| order-review | 订单复盘 | 交易分析 | P0 | F-005 | auth | MISSING |
| fund-analysis | 资金曲线分析 | 交易分析 | P1 | F-006 | order-review | MISSING |
| app-shell | 应用骨架 | 技术基础设施 | P0 | （聚合所有页面） | 全部业务模块 | PENDING |

---

## 模块详情

### auth — 账号与 API 绑定

**业务职责**：用户注册/登录、Binance API Key 绑定与安全存储。

**边界**：
- 包含：注册、登录、API Key 绑定页、个人设置入口
- 不含：具体业务数据展示

**上游 PRD**：F-001
**下游依赖**：market-research、alpha-tracker、order-review、fund-analysis

**阶段状态**
| 阶段 | 状态 |
|---|---|
| Design | MISSING |
| UI | MISSING |
| Arch | MISSING |
| Spec | MISSING |
| Tasks | MISSING |

---

### market-research — 行情调研

**业务职责**：展示热门板块轮动信息和宏观市场消息简报。

**边界**：
- 包含：板块列表、板块龙头、宏观消息列表、AI 摘要
- 不含：用户个人数据、订单数据

**上游 PRD**：F-002, F-003
**下游依赖**：无

**阶段状态**
| 阶段 | 状态 |
|---|---|
| Design | MISSING |
| UI | MISSING |
| Arch | MISSING |
| Spec | MISSING |
| Tasks | MISSING |

---

### alpha-tracker — Alpha 项目跟踪

**业务职责**：定时抓取 Binance Alpha 项目，标记底部盘整候选，支持用户打标关注。

**边界**：
- 包含：Alpha 项目列表、底部盘整标记、定投关注功能
- 不含：自动下单、量化回测

**上游 PRD**：F-004
**下游依赖**：无

**阶段状态**
| 阶段 | 状态 |
|---|---|
| Design | MISSING |
| UI | MISSING |
| Arch | MISSING |
| Spec | MISSING |
| Tasks | MISSING |

---

### order-review — 订单复盘

**业务职责**：拉取 Binance 已平仓订单，接收用户交易逻辑输入，生成 AI 复盘诊断报告。

**边界**：
- 包含：订单列表、逻辑输入、AI 复盘报告、导出功能
- 不含：自动下单、实时行情

**上游 PRD**：F-005
**下游依赖**：fund-analysis（提供订单数据）

**阶段状态**
| 阶段 | 状态 |
|---|---|
| Design | MISSING |
| UI | MISSING |
| Arch | MISSING |
| Spec | MISSING |
| Tasks | MISSING |

---

### fund-analysis — 资金曲线分析

**业务职责**：基于订单数据可视化盈亏曲线，检测异常模式触发 AI 风险预警。

**边界**：
- 包含：盈亏曲线图表、连续亏损/盈利检测、AI 预警提示、阈值设置
- 不含：账户余额管理

**上游 PRD**：F-006
**下游依赖**：无
**数据依赖**：order-review（已平仓订单数据）

**阶段状态**
| 阶段 | 状态 |
|---|---|
| Design | MISSING |
| UI | MISSING |
| Arch | MISSING |
| Spec | MISSING |
| Tasks | MISSING |

---

### app-shell（保留技术模块）

**职责**：全局信息架构、路由配置、导航结构、认证守卫、全局布局。
**生成时机**：P4–P7 各业务模块同阶段完成后聚合，P8 生成工程前置任务 APP-SHELL-001。
**当前状态**：PENDING（等待所有业务模块 P4–P7 完成）

---

## 执行顺序（串行计划）

```
1. auth         ← P0，其他所有模块的前提
2. order-review ← P0，fund-analysis 的数据上游
3. market-research  ← P1，独立
4. alpha-tracker    ← P1，独立
5. fund-analysis    ← P1，依赖 order-review
[后] app-shell  ← 所有业务模块 P4-P7 完成后聚合
```

## 并行候选（识别，暂不执行并行）

- `market-research` 与 `alpha-tracker` 可并行（无交叉依赖）
- `market-research`、`alpha-tracker` 与 `fund-analysis` 可并行（在 order-review 完成后）

## 跨模块约束

- 所有模块均依赖 `auth` 的 API Key 绑定能力
- `fund-analysis` 的盈亏曲线数据直接来自 `order-review` 的已平仓订单
- `app-shell` 全局导航需在所有业务页面 UI 确定后才能最终确定
