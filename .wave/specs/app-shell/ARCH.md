# ARCH: app-shell — 应用骨架

> 聚合来源：全部业务模块 ARCH
> 状态：READY | 技术栈：React + Vite + TanStack Router + Tailwind CSS v4

---

## 目标前端项目

`apps/web`（Vite + React + TanStack Router）

---

## 路由树

```ts
// apps/web/src/routes/__root.tsx  → RootLayout（Header + Sidebar）
// apps/web/src/routes/index.tsx   → / 行情调研首页
// apps/web/src/routes/alpha.tsx   → /alpha Alpha 项目
// apps/web/src/routes/orders/
//   index.tsx                     → /orders 订单列表
//   $orderId.tsx                  → /orders/:orderId 订单详情
// apps/web/src/routes/analysis.tsx → /analysis 资金曲线
// apps/web/src/routes/settings.tsx → /settings 设置
// apps/web/src/routes/login.tsx    → /login 登录
// apps/web/src/routes/register.tsx → /register 注册
```

---

## 认证守卫

```ts
// 受保护路由在 beforeLoad 中检查 session：
// 未登录 → redirect('/login', { search: { redirect: location.href } })
// 登录后未绑定 Key → 允许进入，但页面内展示引导横幅

// 受保护路由：/orders、/orders/$orderId、/analysis、/settings
// 半公开路由：/、/alpha（未登录可查看，登录后解锁写操作）
```

---

## 全局状态

```ts
// apps/web/src/context/AppContext.tsx
AppContext: {
  session: Session | null          // better-auth 当前会话
  apiKeyBound: boolean             // trpc.apiKey.getStatus() 结果
}
// 在 __root.tsx loader 中预取，注入所有子路由
```

---

## 样式系统

- **Tailwind CSS v4**：`packages/ui/src/styles/globals.css` 导入
- **shadcn/ui（Base UI）**：组件来自 `@trade-mind/ui/components/*`
- **主题**：next-themes 提供 dark/light 切换（`packages/ui`）

---

## 新增组件（本 shell 层）

| 组件 | 路径 | 说明 |
|---|---|---|
| RootLayout | `apps/web/src/components/layout/root-layout.tsx` | Header + Sidebar + 横幅插槽 |
| Sidebar | `apps/web/src/components/layout/sidebar.tsx` | 导航项列表 |
| Alert/Banner | `@trade-mind/ui/components/alert.tsx` | 需新增到 packages/ui |
| Textarea | `@trade-mind/ui/components/textarea.tsx` | 需新增到 packages/ui |
| Tabs | `@trade-mind/ui/components/tabs.tsx` | 需新增到 packages/ui |
| Badge | `@trade-mind/ui/components/badge.tsx` | 需新增到 packages/ui |
| Tooltip | `@trade-mind/ui/components/tooltip.tsx` | 需新增到 packages/ui |

---

## 允许修改边界

- 可修改：`apps/web/src/**`、`packages/ui/src/**`
- 不修改：`apps/server`（由各模块 ARCH 独立定义接口）、`packages/db` schema（由各模块 ARCH 定义）
