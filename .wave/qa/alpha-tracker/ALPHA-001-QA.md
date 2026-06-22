# QA Report: ALPHA-001 — alpha_projects + user_watchlist Schema

> 日期：2026-06-22 | 任务：ALPHA-001 | 模块：alpha-tracker | 结论：✅ PASSED

---

## 验收标准映射

| 标准 | 验证方式 | 结论 |
|---|---|---|
| `alpha_projects` 含 `isBottomConsolidation` 字段 | `psql \d alpha_projects` + `information_schema.columns` | ✅ PASSED |
| `user_watchlist` 有 UNIQUE(userId, projectId) 约束 | 重复插入触发 `duplicate key violates unique constraint` | ✅ PASSED |
| `pnpm db:push` 成功（DB 表结构已应用） | `psql -f 0001_oval_blindfold.sql` + 表结构验证 | ✅ PASSED |

---

## 自动化验证

| 检查项 | 命令 | 结论 |
|---|---|---|
| TypeScript 类型检查 | `pnpm check-types` | ✅ 3/3 PASSED |
| Biome lint（新文件） | `npx biome check schema/alpha.ts` | ✅ 1 fix applied |
| DB 连通性 | `psql SELECT 1` | ✅ PASSED |

---

## 数据库结构验证

### alpha_projects（10 列）

| 列 | 类型 | 约束 | ✓ |
|---|---|---|---|
| id | text | NOT NULL, PK | ✅ |
| binance_id | text | NOT NULL, UNIQUE | ✅ |
| name | text | NOT NULL | ✅ |
| symbol | text | NOT NULL | ✅ |
| price | numeric(20,8) | NULL | ✅ |
| change_7d_percent | numeric(10,4) | NULL | ✅ |
| change_30d_percent | numeric(10,4) | NULL | ✅ |
| volatility_7d | numeric(10,4) | NULL | ✅ |
| is_bottom_consolidation | boolean | NOT NULL DEFAULT false | ✅ |
| updated_at | timestamp | NOT NULL DEFAULT now() | ✅ |

索引（5）：pkey, binance_id_unique, symbol_idx, updated_at_idx, is_bottom_consolidation_idx ✅

### user_watchlist（4 列）

| 列 | 类型 | 约束 | ✓ |
|---|---|---|---|
| id | text | NOT NULL, PK | ✅ |
| user_id | text | NOT NULL, FK→user(cascade) | ✅ |
| project_id | text | NOT NULL, FK→alpha_projects(cascade) | ✅ |
| added_at | timestamp | NOT NULL DEFAULT now() | ✅ |

索引（3）：pkey, user_id_idx, user_project_idx(UNIQUE) ✅

---

## 约束行为测试

| 测试场景 | 期望 | 实测 |
|---|---|---|
| 插入重复 (userId, projectId) | duplicate key error | ✅ 触发 `user_watchlist_user_project_idx` |
| 插入重复 binance_id | duplicate key error | ✅ 触发 `alpha_projects_binance_id_unique` |
| 删除 user → watchlist 条目 | CASCADE DELETE | ✅ 0 rows remaining |

---

## 已知问题

- `schema/index.ts` 存在 `noBarrelFile` lint warning：系项目已有模式（auth/market/orders/todo 均已存在），非本次引入，不阻塞

---

## 结论：✅ PASSED

所有验收标准满足，数据库约束行为正确，类型检查通过。可进入 N8 Checkpoint。
