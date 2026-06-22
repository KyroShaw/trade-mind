# QA Report: ALPHA-003 — Alpha 项目列表页

> 日期：2026-06-22 | 任务：ALPHA-003 | 模块：alpha-tracker | 结论：✅ PASSED

---

## 验收标准映射

| 标准 | 验证方式 | 结论 |
|---|---|---|
| 项目列表完整展示（价格、7d/30d 涨跌） | AllProjectsTab：symbol/name/price/change7d/change30d 列齐全 | ✅ PASSED |
| 底部候选 Badge 正确标记，Tooltip 展示规则数据 | BottomBadge: isBottomConsolidation=true 时展示 warning Badge；TooltipContent 含 30d/7d 数据 | ✅ PASSED |
| 未登录点击"定投关注"提示登录 | WatchButton: !isLoggedIn → toast.error("请先登录后再关注") | ✅ PASSED |
| 已登录时关注/取消关注即时更新 | addMutation/removeMutation onSuccess → invalidateQueries(getWatchlist) | ✅ PASSED |
| "我的关注" Tab 展示用户已关注列表 | WatchlistTab: trpc.alpha.getWatchlist，enabled: isLoggedIn | ✅ PASSED |

---

## 自动化验证

| 检查项 | 命令 | 结论 |
|---|---|---|
| TypeScript 类型检查 | `pnpm check-types` | ✅ 3/3 PASSED |
| Biome lint | `npx biome check --write alpha.tsx` | ✅ 1 fix applied（格式），无逻辑问题 |
| Vite build | 包含在 check-types 流程中 | ✅ built in 356ms |

---

## UI 状态覆盖

| 状态 | 实现 | 结论 |
|---|---|---|
| loading | TableSkeleton（6行骨架屏） | ✅ |
| empty（无项目数据） | "暂无 Alpha 项目数据" | ✅ |
| empty（无关注） | "暂无关注项目，去全部项目中添加" | ✅ |
| 未登录查看关注 | "请先登录以查看关注列表" | ✅ |
| 底部候选 Badge | variant="warning"，悬停展示 Tooltip | ✅ |
| 已关注状态 | "✓ 已关注"，variant="secondary" | ✅ |
| 关注/取消操作失败 | onError → toast.error(err.message) | ✅ |

---

## 可访问性

| 检查项 | 结论 |
|---|---|
| 表格使用语义化 `<table>/<th>/<td>` | ✅ |
| WatchButton 有 aria-label（"关注 TOKEN1" / "取消关注 TOKEN1"） | ✅ |
| TooltipContent 有 role="tooltip"（来自 UI 组件定义） | ✅ |
| Tooltip 键盘可触发（onFocus/onBlur 来自 UI 组件） | ✅ |

---

## 安全审查

| 检查项 | 结论 |
|---|---|
| getWatchlist 只在 isLoggedIn=true 时启用 | ✅ enabled: isLoggedIn |
| add/remove 操作通过 tRPC protectedProcedure 保护 | ✅ 后端已验证 |
| 用户只能看到自己的 watchlist（后端过滤） | ✅ |

---

## 结论：✅ PASSED

所有验收标准满足，UI 状态覆盖完整，可访问性符合要求。可进入 N8 Checkpoint。
