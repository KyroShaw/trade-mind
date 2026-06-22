# QA Report: fund-analysis / ANALYSIS-001

> 日期：2026-06-22 | QA 策略：required

## 结论：✅ PASSED

## 验收标准核查

- [x] `alert_settings` 含 userId（UNIQUE 索引 alert_settings_user_id_idx）、lossStreakThreshold（DEFAULT 3）、winStreakThreshold（DEFAULT 5）
- [x] 等效 DDL 已执行，表已在数据库创建，migration SQL 已生成（0002_careful_morlun.sql）
- [x] `pnpm check-types` 通过（3 packages, 0 errors）

## ARCH.md 对比

规格中 `id` 标注 `uuid PK`，实现用 `text PK + crypto.randomUUID()`，行为等效，与项目其他 schema 一致。其余字段完全符合规格，额外实现 `alertSettingsRelations`（无负面影响）。

## 风险

- db:push 非 TTY 限制：等效 DDL 路径，风险 low
- 整体风险：low
