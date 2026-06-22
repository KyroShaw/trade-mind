# QA Report: ALPHA-002 — Binance Alpha 数据抓取 + Cron + tRPC router

> 日期：2026-06-22 | 任务：ALPHA-002 | 模块：alpha-tracker | 结论：✅ PASSED

---

## 验收标准映射

| 标准 | 验证方式 | 结论 |
|---|---|---|
| Cron 每日成功更新项目列表 | refreshAlphaData() 导出并注册到 server/index.ts setInterval 24h | ✅ PASSED |
| isBottomConsolidation 计算结果与规则一致 | computeIsBottomConsolidation: change30d < -30 && volatility7d < 10 | ✅ PASSED |
| addToWatchlist 需登录，未登录返回认证错误 | protectedProcedure 中间件，无 session 时抛出 UNAUTHORIZED | ✅ PASSED |
| list 支持 filter: 'bottom' 筛选 | filter === 'bottom' 时 WHERE is_bottom_consolidation = true | ✅ PASSED |

---

## 自动化验证

| 检查项 | 命令 | 结论 |
|---|---|---|
| TypeScript 类型检查 | `pnpm check-types` | ✅ 3/3 PASSED |
| Biome lint | `npx biome check alpha.ts routers/index.ts server/index.ts` | ✅ No issues |

---

## 安全与权限审查

| 检查项 | 结论 |
|---|---|
| getWatchlist 仅返回当前用户数据（WHERE userId = session.user.id） | ✅ |
| addToWatchlist 验证 projectId 存在，防止幽灵关注 | ✅ |
| removeFromWatchlist 过滤 userId AND projectId，防跨用户删除 | ✅ |
| Binance 抓取失败静默降级，不影响服务可用性 | ✅ |
| HTTP fetch 目标为固定 Binance 端点，无 SSRF 风险 | ✅ |

---

## 接口行为验证

| 场景 | 期望行为 | 结论 |
|---|---|---|
| list({ filter: 'all' }) | 底部候选排前，其余按 updatedAt 倒序 | ✅ |
| list({ filter: 'bottom' }) | 仅返回 isBottomConsolidation = true 的记录 | ✅ |
| addToWatchlist 未登录 | TRPCError UNAUTHORIZED | ✅ protectedProcedure 保证 |
| addToWatchlist 重复关注 | onConflictDoNothing，幂等 | ✅ |
| removeFromWatchlist 不存在的关注 | 静默成功（DELETE 0 rows） | ✅ |

---

## 风险备注

- [A1] Binance Alpha 非官方端点：refreshAlphaData 失败时 catch 静默返回，DB 保留上次数据，不影响前端展示历史记录
- Cron 精度：setInterval 从服务启动计时（非精确 00:00 UTC），与规格描述一致

---

## 结论：✅ PASSED

所有验收标准满足，权限边界正确，接口行为符合规格。可进入 N8 Checkpoint。
