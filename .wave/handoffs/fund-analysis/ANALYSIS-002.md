# Handoff: fund-analysis / ANALYSIS-002

- **角色**：backend-engineer
- **状态**：DONE
- **Git 基线**：13d48a9
- **模块**：fund-analysis
- **TASK-ID**：ANALYSIS-002

## 修改文件

- packages/api/src/routers/analysis.ts（新建）
- packages/api/src/routers/index.ts（修改，注册 analysisRouter）

## 执行结果

成功实现 analysisRouter 包含 getCurve、getSummary、getAlert、updateAlertSettings 四个 protectedProcedure 接口。

- getCurve：按天/周分组计算累计盈亏，返回 CurvePoint[]
- getSummary：SQL 聚合计算 totalPnl、winRate、avgPnlRatio
- getAlert：读取 alert_settings 阈值，检测连续亏损/盈利，触发时调用 Claude API 生成分析，内存缓存 1 小时
- updateAlertSettings：验证 [2-10] 范围，upsert 到 alert_settings 表

pnpm check-types 通过（3/3，0 错误）

## 验收标准完成情况

- [x] getCurve 返回正确的累计盈亏曲线数据（CurvePoint: { date, dailyPnl, cumulativePnl }）
- [x] getAlert 在连续亏损 ≥ 阈值时返回 triggered: true 和 aiAnalysis
- [x] aiAnalysis 内容 < 200 字（max_tokens=300，中文 prompt 限制 200 字）
- [x] updateAlertSettings 范围验证（2-10 笔），超出范围抛 BAD_REQUEST

## 风险说明

- Claude API 调用有 30s AbortController 超时保护，失败时优雅降级（返回错误提示字符串，不抛异常）
- 内存缓存进程重启后清空（符合 MVP 规格）
- ANTHROPIC_API_KEY 缺失时返回提示，不崩溃
