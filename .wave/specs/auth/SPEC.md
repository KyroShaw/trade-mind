# SPEC: auth — 账号与 API 绑定

> 状态：READY | 版本：v0.1

---

## 功能范围

- 用户注册（邮箱 + 密码）
- 用户登录
- Binance API Key 绑定（只读权限）、解绑、状态查询

## 路由

| 路径 | 组件 | 保护级别 |
|---|---|---|
| /login | LoginPage | 公开（已登录重定向首页） |
| /register | RegisterPage | 公开（已登录重定向首页） |
| /settings | SettingsPage | 需登录 |

## 数据库

`users`（better-auth 管理）+ `api_keys`（加密存储 Key/Secret + binanceUid）

## tRPC 接口

```
apiKeyRouter.bind(apiKey, secretKey) → { uid }
apiKeyRouter.unbind() → void
apiKeyRouter.getStatus() → { bound, uid? }
```

## 安全规则

- API Key 用 AES-256-GCM 加密（密钥来自 `ENCRYPTION_KEY` 环境变量）
- `bind` 前调用 Binance `/api/v3/account` 验证 Key 有效且权限只读（`canTrade=false`）
- Session 为 HTTPOnly Cookie，不在前端 JS 中暴露 token

## 验收标准

- AC-001-1：注册/登录流程完整可用
- AC-001-2：绑定 API Key 后拉取到账户基本信息（UID）
- AC-001-3：API Key 明文不出现在任何 HTTP 响应或日志

## 新增 UI 组件

- `packages/ui/src/components/alert.tsx`（错误/成功 Alert）

## 禁止修改范围

- `packages/auth` 配置中的 better-auth provider 设置
- `packages/env` 中已有的环境变量类型定义（只追加）
