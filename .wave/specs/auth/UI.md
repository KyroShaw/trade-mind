# UI: auth — 账号与 API 绑定

> 状态：READY | 组件库：shadcn/ui + Tailwind CSS v4

---

## /login — 登录页

**布局**：居中卡片（max-w-sm），页面垂直居中

```
┌─────────────────────────────┐
│         trade-mind          │  Logo + 产品名（居中）
│                             │
│  邮箱                        │  Input
│  密码                        │  Input（type=password）
│                             │
│  [  登录  ]                  │  Button（primary，全宽）
│                             │
│  没有账号？ 立即注册           │  Link → /register
└─────────────────────────────┘
```

**状态**：
- 提交中：Button 显示 loading spinner，禁用
- 错误：表单下方红色 Alert（"邮箱或密码不正确"）

---

## /register — 注册页

**布局**：同登录页（居中卡片）

```
┌─────────────────────────────┐
│         trade-mind          │
│                             │
│  邮箱                        │  Input
│  密码                        │  Input（type=password）
│  确认密码                    │  Input（type=password）
│                             │
│  [  注册  ]                  │  Button（primary，全宽）
│                             │
│  已有账号？ 立即登录           │  Link → /login
└─────────────────────────────┘
```

**状态**：
- 密码不匹配：inline 字段错误（"两次密码不一致"）
- 邮箱已存在：表单顶部红色 Alert

---

## /settings — 设置页（API Key 绑定区域）

**布局**：单列，Card 包裹

```
┌─────────────────────────────────────────┐
│  Binance API 绑定                        │  Card 标题
│─────────────────────────────────────────│
│  API Key                               │  Input（已绑定则显示脱敏值 ****xxxx）
│  Secret Key                            │  Input（已绑定则显示"已绑定"）
│                                        │
│  ⚠️ 请确保只授予只读权限                 │  提示文字（muted）
│  [如何在 Binance 创建只读 API？]         │  外链
│                                        │
│  [  保存并验证  ]   [  解除绑定  ]       │  Button primary / Button destructive
│                                        │
│  ✅ 已绑定账户：UID 1234****56          │  绑定成功状态（条件展示）
└─────────────────────────────────────────┘
```

**状态**：
- 校验中：Button loading
- 校验成功：Sonner toast "API 绑定成功"，展示 UID 信息
- 校验失败：Card 内红色 Alert（错误原因）

---

## 组件需求

| 组件 | 来源 | 备注 |
|---|---|---|
| Input | @trade-mind/ui | 已有 |
| Button | @trade-mind/ui | 已有 |
| Label | @trade-mind/ui | 已有 |
| Card | @trade-mind/ui | 已有 |
| Sonner | @trade-mind/ui | 已有 |
| Alert | 需新增 | 错误/成功提示 |
