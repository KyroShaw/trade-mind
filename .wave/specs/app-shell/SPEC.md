# SPEC: app-shell — 应用骨架

> 状态：READY | 版本：v0.1

---

## 功能范围

全局路由树、根布局（Header + Sidebar）、认证守卫、全局横幅、404/错误边界。

## 路由树

| 路径 | 组件文件 | 模块 | 保护级别 |
|---|---|---|---|
| / | routes/index.tsx | market-research | 公开 |
| /alpha | routes/alpha.tsx | alpha-tracker | 公开 |
| /orders | routes/orders/index.tsx | order-review | 需登录 |
| /orders/:orderId | routes/orders/$orderId.tsx | order-review | 需登录 |
| /analysis | routes/analysis.tsx | fund-analysis | 需登录 |
| /settings | routes/settings.tsx | auth | 需登录 |
| /login | routes/login.tsx | auth | 公开 |
| /register | routes/register.tsx | auth | 公开 |

## 骨架页规范

- 骨架页只包含：页面标题（`<h1>`）、说明文字、内容区占位（`<div className="...">`）
- **禁止**：业务 API 调用、真实数据展示、复杂交互、Mock 数据

## 全局组件

- `__root.tsx`：RootLayout（Header + Sidebar + 横幅插槽）+ AppContext 注入
- `components/layout/sidebar.tsx`：导航项列表
- `components/layout/header.tsx`：标题 + 用户头像 Dropdown

## 新增 packages/ui 组件

| 组件 | 文件 |
|---|---|
| Alert/Banner | alert.tsx |
| Textarea | textarea.tsx |
| Tabs | tabs.tsx |
| Badge | badge.tsx |
| Tooltip | tooltip.tsx |

## 全局状态（AppContext）

```ts
{ session: Session | null; apiKeyBound: boolean }
```

在 `__root.tsx` loader 中通过 `trpc.apiKey.getStatus()` 预取。

## 允许修改边界

- 可修改：`apps/web/src/**`、`packages/ui/src/**`
- 不修改：`apps/server/**`、`packages/db/src/schema/**`（由各模块分别定义）

## 禁止修改范围

- `packages/auth` better-auth 核心配置
- `packages/env` 类型定义（只追加）
- 其他 `apps/` 目录（fumadocs、server 由各模块任务处理）
