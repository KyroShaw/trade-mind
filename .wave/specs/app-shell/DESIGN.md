# DESIGN: app-shell — 应用骨架

> 聚合来源：auth + market-research + alpha-tracker + order-review + fund-analysis
> 状态：READY

---

## 全局信息架构

### 路由结构

```
/               行情调研（首页，默认）
/alpha          Alpha 项目跟踪
/orders         订单复盘列表
/orders/:id     订单详情 + 复盘报告
/analysis       资金曲线分析
/settings       设置（API Key 绑定）
/login          登录
/register       注册
```

### 认证守卫

- `/login`、`/register`、`/`（行情调研，部分公开）：无需登录
- `/alpha`（查看列表，无需登录；关注功能需登录）
- `/orders`、`/orders/:id`、`/analysis`、`/settings`：需登录 + API Key 绑定

---

## 全局导航

### 侧边栏导航（桌面端）

```
[Logo: trade-mind]
────────────────
📊 行情调研         /
🔍 Alpha 项目       /alpha
📋 订单复盘         /orders
📈 资金曲线         /analysis
────────────────
⚙️  设置            /settings
[用户头像 + 名称]
[登出]
```

### 顶部 Header

- 左：页面标题（根据当前路由动态显示）
- 右：数据刷新时间标记 + 用户头像

---

## 全局状态

### 未登录态

- 侧边栏底部展示"登录 / 注册"按钮，替换用户信息
- 访问需认证页面时重定向 `/login`，登录后返回来源页

### 未绑定 API Key 态（已登录但未绑定）

- 顶部展示引导横幅："绑定 Binance API 以解锁完整功能 → [立即绑定]"
- 订单复盘、资金曲线页内容区用空状态代替

### 风险预警态

- fund-analysis 触发预警时，在 `/analysis` 页顶部展示预警横幅（不影响其他页面）

---

## 全局布局

```
+----------------------------------+
| Header                           |
+--------+-------------------------+
| Side   |                         |
| Bar    |   <Page Content>        |
|        |                         |
+--------+-------------------------+
```

响应式：移动端侧边栏折叠为底部 Tab Bar（MVP 暂不支持移动端，可保留结构）。

---

## 跨模块跳转

| 触发点 | 来源 | 目标 |
|---|---|---|
| 未绑定横幅"立即绑定" | 全局 | /settings |
| 空状态"前往订单复盘" | fund-analysis | /orders |
| 订单列表中点击订单 | order-review | /orders/:id |
| 注册成功后 | auth | /settings |
| 未登录点击"定投关注" | alpha-tracker | /login |
