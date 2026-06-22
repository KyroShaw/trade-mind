# LESSONS.md — 跨任务经验沉淀

> 只记录跨任务仍然有效的架构决策、踩坑记录和业务规则确认。不写流水账。

## 格式

```
### [日期] 标题
- **背景**：为什么出现这个问题
- **结论**：决定是什么
- **影响范围**：哪些任务/模块需要遵守
```

---

### [2026-06-19] TanStack Router 文件命名 vs Biome kebab-case
- **背景**：`$orderId.tsx` 被 `lint/style/useFilenamingConvention` 报 Must Fix；但 TanStack Router 用文件名作 param key，重命名为 `$order-id.tsx` 会导致 `params['order-id']`，破坏 JS 访问符规范。
- **结论**：在文件顶部加 `// biome-ignore lint/style/useFilenamingConvention:` 注释保留 camelCase，不重命名。
- **影响范围**：所有含参数段的路由文件（`$paramName.tsx`）。

### [2026-06-19] theme-provider.tsx 不应 re-export useTheme
- **背景**：`export { useTheme } from "next-themes"` 触发 `lint/performance/noBarrelFile` 错误。
- **结论**：删除该 re-export；调用方直接 `import { useTheme } from "next-themes"`。
- **影响范围**：凡需要 `useTheme` 的组件（当前仅 `mode-toggle.tsx`）。

### [2026-06-19] 侧边栏 Sidebar 替代 Header 作为主导航
- **背景**：产品设计为仪表盘式，侧边栏比顶部导航更适合；`header.tsx` 已被删除。
- **结论**：主导航由 `apps/web/src/components/layout/sidebar.tsx` 实现，`__root.tsx` 只含全局 Provider 和 `<Outlet />`。
- **影响范围**：所有前端页面任务，不要引用或重建 Header 组件。

<!-- 在此追加新经验 -->
