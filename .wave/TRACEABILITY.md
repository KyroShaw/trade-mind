# TRACEABILITY.md — 需求可追溯矩阵

> 生成日期：2026-06-19 | 版本：v0.1

---

## F-001：用户账号与 Binance API 绑定

| 维度 | 产物 |
|---|---|
| **模块** | auth |
| **Design** | `.wave/specs/auth/DESIGN.md` |
| **UI** | `.wave/specs/auth/UI.md` |
| **Arch** | `.wave/specs/auth/ARCH.md` |
| **Spec** | `.wave/specs/auth/SPEC.md` |
| **任务** | AUTH-001、AUTH-002、AUTH-003、AUTH-004 |
| **AC** | AC-001-1、AC-001-2、AC-001-3 |

---

## F-002：板块轮动感知

| 维度 | 产物 |
|---|---|
| **模块** | market-research |
| **Design** | `.wave/specs/market-research/DESIGN.md` |
| **UI** | `.wave/specs/market-research/UI.md` |
| **Arch** | `.wave/specs/market-research/ARCH.md` |
| **Spec** | `.wave/specs/market-research/SPEC.md` |
| **任务** | MARKET-001、MARKET-002、MARKET-003 |
| **AC** | AC-002-1、AC-002-2、AC-002-3 |

---

## F-003：宏观消息追踪

| 维度 | 产物 |
|---|---|
| **模块** | market-research（与 F-002 共模块） |
| **Design** | `.wave/specs/market-research/DESIGN.md` |
| **UI** | `.wave/specs/market-research/UI.md` |
| **Arch** | `.wave/specs/market-research/ARCH.md` |
| **Spec** | `.wave/specs/market-research/SPEC.md` |
| **任务** | MARKET-001、MARKET-002、MARKET-003 |
| **AC** | AC-003-1、AC-003-2、AC-003-3 |

---

## F-004：Binance Alpha 项目跟踪

| 维度 | 产物 |
|---|---|
| **模块** | alpha-tracker |
| **Design** | `.wave/specs/alpha-tracker/DESIGN.md` |
| **UI** | `.wave/specs/alpha-tracker/UI.md` |
| **Arch** | `.wave/specs/alpha-tracker/ARCH.md` |
| **Spec** | `.wave/specs/alpha-tracker/SPEC.md` |
| **任务** | ALPHA-001、ALPHA-002、ALPHA-003 |
| **AC** | AC-004-1、AC-004-2、AC-004-3 |

---

## F-005：已平仓订单复盘

| 维度 | 产物 |
|---|---|
| **模块** | order-review |
| **Design** | `.wave/specs/order-review/DESIGN.md` |
| **UI** | `.wave/specs/order-review/UI.md` |
| **Arch** | `.wave/specs/order-review/ARCH.md` |
| **Spec** | `.wave/specs/order-review/SPEC.md` |
| **任务** | ORDER-001、ORDER-002、ORDER-003、ORDER-004、ORDER-005 |
| **AC** | AC-005-1、AC-005-2、AC-005-3、AC-005-4 |

---

## F-006：资金曲线分析与风险预警

| 维度 | 产物 |
|---|---|
| **模块** | fund-analysis |
| **Design** | `.wave/specs/fund-analysis/DESIGN.md` |
| **UI** | `.wave/specs/fund-analysis/UI.md` |
| **Arch** | `.wave/specs/fund-analysis/ARCH.md` |
| **Spec** | `.wave/specs/fund-analysis/SPEC.md` |
| **任务** | ANALYSIS-001、ANALYSIS-002、ANALYSIS-003 |
| **AC** | AC-006-1、AC-006-2、AC-006-3、AC-006-4 |

---

## 全局基础设施

| 维度 | 产物 |
|---|---|
| **模块** | app-shell |
| **Design** | `.wave/specs/app-shell/DESIGN.md` |
| **UI** | `.wave/specs/app-shell/UI.md` |
| **Arch** | `.wave/specs/app-shell/ARCH.md` |
| **Spec** | `.wave/specs/app-shell/SPEC.md` |
| **任务** | APP-SHELL-001（scaffold） |

---

## 完整任务清单

| ID | 模块 | 角色 | 类型 | 依赖 |
|---|---|---|---|---|
| APP-SHELL-001 | app-shell | frontend-engineer | scaffold | 无 |
| AUTH-001 | auth | database-engineer | feature | APP-SHELL-001 |
| AUTH-002 | auth | backend-engineer | feature | AUTH-001 |
| AUTH-003 | auth | frontend-engineer | feature | APP-SHELL-001 |
| AUTH-004 | auth | frontend-engineer | feature | AUTH-002、AUTH-003 |
| ORDER-001 | order-review | database-engineer | feature | AUTH-001 |
| ORDER-002 | order-review | backend-engineer | feature | ORDER-001、AUTH-002 |
| ORDER-003 | order-review | backend-engineer | feature | ORDER-001 |
| ORDER-004 | order-review | frontend-engineer | feature | ORDER-002、APP-SHELL-001 |
| ORDER-005 | order-review | frontend-engineer | feature | ORDER-003、ORDER-004 |
| MARKET-001 | market-research | database-engineer | feature | AUTH-001 |
| MARKET-002 | market-research | backend-engineer | feature | MARKET-001 |
| MARKET-003 | market-research | frontend-engineer | feature | MARKET-002、APP-SHELL-001 |
| ALPHA-001 | alpha-tracker | database-engineer | feature | AUTH-001 |
| ALPHA-002 | alpha-tracker | backend-engineer | feature | ALPHA-001 |
| ALPHA-003 | alpha-tracker | frontend-engineer | feature | ALPHA-002、APP-SHELL-001 |
| ANALYSIS-001 | fund-analysis | database-engineer | feature | AUTH-001 |
| ANALYSIS-002 | fund-analysis | backend-engineer | feature | ANALYSIS-001、ORDER-001 |
| ANALYSIS-003 | fund-analysis | frontend-engineer | feature | ANALYSIS-002、ORDER-004、APP-SHELL-001 |
