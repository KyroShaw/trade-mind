# Handoff: fund-analysis / ANALYSIS-001

- **角色**：database-engineer
- **状态**：DONE
- **Git 基线**：13d48a9
- **模块**：fund-analysis
- **TASK-ID**：ANALYSIS-001

## 修改文件

- packages/db/src/schema/analysis.ts（新建）
- packages/db/src/schema/index.ts（修改，添加 export * from "./analysis"）
- packages/db/src/migrations/0002_careful_morlun.sql（新建，由 db:generate 生成）
- packages/db/src/migrations/meta/_journal.json（由 db:generate 自动更新）
- packages/db/src/migrations/meta/0002_snapshot.json（新建，由 db:generate 生成）

## 执行结果

成功创建 alertSettings 表（alert_settings），包含所有规格要求字段。

pnpm db:push 因 drizzle-kit 0.31.x 在非 TTY 环境下无法跳过 rename-detection 交互提示而失败（--force 仅跳过数据丢失告警，不跳过 tablesResolver）。改为执行 pnpm db:generate（生成迁移文件 0002_careful_morlun.sql）后，通过 pg 客户端直接执行等效 DDL 完成表创建，与生成的迁移文件内容一致。

pnpm check-types 全量通过（3 packages，0 错误）。

pnpm fix 因项目预存在的 fumadocs 嵌套 biome.json 配置冲突退出（与本任务无关）；对两个修改文件单独运行 biome check --write，analysis.ts 格式化成功，index.ts 仅触发 noBarrelFile 规则（该规则在项目所有 schema 导出文件中均已存在，属预存在问题）。

## 验收标准完成情况

- [x] alert_settings 含 userId（UNIQUE 索引 alert_settings_user_id_idx）、lossStreakThreshold（DEFAULT 3）、winStreakThreshold（DEFAULT 5）
- [x] 表已在数据库中创建（DDL 与 pnpm db:generate 生成的迁移 SQL 完全一致）

## 执行命令

1. pnpm db:generate — 生成迁移文件 0002_careful_morlun.sql
2. pg 客户端直接执行 DDL（等效于生成的迁移 SQL，绕过非 TTY 限制）
3. npx biome check --write packages/db/src/schema/analysis.ts packages/db/src/schema/index.ts
4. pnpm check-types — 全量类型检查通过

## 验证结果

数据库中 alert_settings 表结构确认：
- id: text PK NOT NULL
- user_id: text NOT NULL, FK -> user.id ON DELETE CASCADE, UNIQUE INDEX alert_settings_user_id_idx
- loss_streak_threshold: integer DEFAULT 3 NOT NULL
- win_streak_threshold: integer DEFAULT 5 NOT NULL
- updated_at: timestamp DEFAULT now() NOT NULL

## 迁移与回滚风险

- 风险：low。纯新增表，无现有数据影响，无破坏性操作。
- 回滚：执行 DROP TABLE alert_settings 即可完全撤销；生成的迁移文件可保留以备重新应用。
- 注意：pnpm db:migrate 当前无法正常工作，因项目历史上使用 db:push 而非迁移模式，drizzle_migrations 表不存在，migrate 命令会尝试重新应用已有迁移并报冲突。后续如需切换为迁移模式需要初始化 journal 记录。

## 建议下一节点

backend-engineer 节点执行 ANALYSIS-002（tRPC 路由实现），可直接消费 alertSettings 表和导出的 Drizzle schema。
