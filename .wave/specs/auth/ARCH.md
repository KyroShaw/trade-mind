# ARCH: auth — 账号与 API 绑定

> 状态：READY | 技术栈：better-auth + tRPC + Drizzle + PostgreSQL

---

## 模块边界

- **前端**：`apps/web` — 登录/注册/设置页，使用 better-auth 客户端
- **后端**：`apps/server` — better-auth handler + tRPC apiKey router
- **认证包**：`packages/auth` — better-auth 配置共享
- **数据库**：`packages/db` — users、api_keys 表

---

## 数据模型

```ts
// packages/db/src/schema/auth.ts
users: {
  id: uuid PK
  email: text UNIQUE NOT NULL
  createdAt: timestamp
}

api_keys: {
  id: uuid PK
  userId: uuid FK → users.id
  encryptedKey: text NOT NULL      // AES-256-GCM 加密
  encryptedSecret: text NOT NULL
  binanceUid: text                 // 绑定成功后存储（脱敏）
  isValid: boolean DEFAULT true
  createdAt: timestamp
  updatedAt: timestamp
}
```

> better-auth 自管理 session 表，不需要手动定义。

---

## API（tRPC）

```ts
// packages/api/src/routers/apiKey.ts
apiKeyRouter = {
  bind(input: { apiKey: string; secretKey: string }): BindResult
  unbind(): void
  getStatus(): { bound: boolean; uid?: string }
}
```

- `bind`：验证 Key 有效性（调用 Binance GET /api/v3/account），加密后存 DB
- `unbind`：软删除或清空记录
- `getStatus`：返回绑定状态和脱敏 UID（供全局状态判断）

---

## 安全

- API Key 加密：AES-256-GCM，密钥来自 `@trade-mind/env`（环境变量 `ENCRYPTION_KEY`）
- Binance API 权限：仅验证只读权限（检测 `canTrade=false`）
- better-auth session：HTTPOnly Cookie，服务端签名

---

## 前端集成

```ts
// apps/web
import { authClient } from '@trade-mind/auth/client'
// TanStack Router beforeLoad 守卫：未登录时 redirect('/login')
// useQuery: trpc.apiKey.getStatus → 全局 context 注入绑定状态
```

---

## 跨模块契约

- 所有业务模块路由守卫依赖 `auth.getStatus()` 判断登录态
- `apiKey.getStatus()` 返回 `{ bound: boolean }` 供 app-shell 全局横幅
