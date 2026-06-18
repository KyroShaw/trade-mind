# TASKS: auth — 账号与 API 绑定

> 状态：READY

---

## AUTH-001：数据库 schema — api_keys 表

- **任务类型**：feature
- **执行角色**：database-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：APP-SHELL-001

**范围**：
- 在 `packages/db/src/schema/auth.ts` 新增 `api_keys` 表定义
- 添加 `ENCRYPTION_KEY` 到 `packages/env`
- 生成并运行 migration

**验收标准**：
- [ ] `api_keys` 表含 id、userId、encryptedKey、encryptedSecret、binanceUid、isValid、timestamps
- [ ] `packages/env` 包含 `ENCRYPTION_KEY` 类型定义
- [ ] `pnpm db:push` 成功
- [ ] `pnpm check-types` 通过

---

## AUTH-002：tRPC apiKey router — 绑定/解绑/状态

- **任务类型**：feature
- **执行角色**：backend-engineer
- **风险等级**：medium
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：AUTH-001

**范围**：
- 实现 `packages/api/src/routers/apiKey.ts`（bind、unbind、getStatus）
- `bind`：AES-256-GCM 加密，调用 Binance `/api/v3/account` 验证只读权限
- 注册到 tRPC root router

**验收标准**：
- [ ] `bind` 使用有效只读 Key 时返回 UID，成功写入 DB（加密）
- [ ] `bind` 使用无效 Key 时返回明确错误（不抛 500）
- [ ] `unbind` 清空记录
- [ ] `getStatus` 返回正确绑定状态
- [ ] API Key 明文不出现在任何响应字段

---

## AUTH-003：前端 — 登录 / 注册页

- **任务类型**：feature
- **执行角色**：frontend-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：可与 AUTH-002 并行（共同依赖 AUTH-001）
- **依赖**：APP-SHELL-001

**范围**：
- 实现 `/login`、`/register` 页面（参照 `auth/UI.md`）
- 集成 better-auth 客户端（signIn、signUp）
- 已登录用户访问时重定向首页

**验收标准**：
- [ ] 注册成功后重定向 `/settings`
- [ ] 登录成功后重定向首页（或登录前来源页）
- [ ] 表单错误（邮箱已存在、密码错误）有明确提示
- [ ] 提交中 Button 为 loading 状态

---

## AUTH-004：前端 — 设置页 API Key 绑定 UI

- **任务类型**：feature
- **执行角色**：frontend-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：AUTH-002、AUTH-003、APP-SHELL-001

**范围**：
- 实现 `/settings` 页绑定/解绑 UI（参照 `auth/UI.md`）
- 调用 `trpc.apiKey.bind`、`trpc.apiKey.unbind`、`trpc.apiKey.getStatus`
- 绑定成功后更新 AppContext 中的 `apiKeyBound` 状态

**验收标准**：
- [ ] 绑定成功展示 UID（脱敏），Sonner toast 提示
- [ ] 绑定失败展示错误原因
- [ ] 解绑后页面状态重置
- [ ] 全局未绑定横幅在绑定成功后消失

**验证命令**：
```bash
pnpm dev:web   # 手动验证绑定流程
pnpm check-types
```
