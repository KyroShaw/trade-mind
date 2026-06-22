# TASKS: app-shell — 应用骨架

> 状态：DONE

---

## [x] APP-SHELL-001：构建应用骨架

- **任务类型**：scaffold
- **执行角色**：frontend-engineer
- **风险等级**：medium
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：无（所有前端页面任务的前置）

**范围**：
1. 审计 `apps/web/src` 现有代码，清理示例代码和脚手架遗留内容
2. 配置 TanStack Router 路由树（`__root.tsx` + 全部页面路由占位）
3. 实现根布局：Header + Sidebar + 内容区（包含 AppContext Provider）
4. 实现认证守卫（受保护路由 `beforeLoad` 检查）
5. 实现未绑定 API Key 全局横幅插槽（条件展示，逻辑由 AppContext 控制）
6. 新增 `packages/ui` 共用组件：Alert、Textarea、Tabs、Badge、Tooltip
7. 实现 404 页面和全局错误边界
8. 所有业务页面为空占位（只含标题、说明、`<div>` 占位区）

**骨架页验收标准**：
- [x] 路由树完整，8 条路由可访问（新增 /register）
- [x] 根布局 Sidebar + 内容区正确渲染（无 Header，改为侧边栏布局）
- [x] 未登录访问 `/orders`、`/analysis`、`/settings` 时重定向 `/login`
- [x] 未绑定横幅占位元素存在（条件渲染逻辑已接入 AppContext）
- [x] 404 页面可访问（访问不存在路径）
- [x] 所有 packages/ui 新增组件通过 TypeScript 类型检查
- [x] `pnpm check-types` 通过

**QA 报告**: `.wave/qa/app-shell/APP-SHELL-001-QA.md` — PASSED  
**完成日期**: 2026-06-19

**验证命令**：
```bash
pnpm dev:web   # 启动前端，访问各路由验证
pnpm check-types
pnpm check
```
