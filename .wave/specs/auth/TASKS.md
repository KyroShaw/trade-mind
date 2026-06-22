# TASKS: auth — 账号与 API 绑定

> 状态：DONE

---

## [x] AUTH-001：数据库 schema — api_keys 表

- **任务类型**：feature
- **执行角色**：database-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：APP-SHELL-001

**范围**：
- 在 `packages/db/src/schema/auth.ts` 新增 `api_keys` 表定义（含 uniqueIndex on userId）
- 添加 `ENCRYPTION_KEY` 到 `packages/env/src/server.ts`
- Schema 已导出，待 DB 可用时运行 `pnpm db:push`

**验收标准**：
- [x] `api_keys` 表含 id、userId、encryptedKey、encryptedSecret、binanceUid、isValid、timestamps
- [x] `packages/env` 包含 `ENCRYPTION_KEY` 类型定义（64-char hex）
- [x] `pnpm check-types` 通过（db:push 需真实 DB，文档提醒用户执行）

**完成日期**: 2026-06-22

---

## [x] AUTH-002：tRPC apiKey router — 绑定/解绑/状态

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
- [x] `bind` 使用有效只读 Key 时返回 UID，成功写入 DB（加密）
- [x] `bind` 使用无效 Key 时返回明确错误（不抛 500）
- [x] `unbind` 清空记录
- [x] `getStatus` 返回正确绑定状态
- [x] API Key 明文不出现在任何响应字段

**完成日期**: 2026-06-22

---

## [x] AUTH-003：前端 — 登录 / 注册页

- **任务类型**：feature
- **执行角色**：frontend-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：可与 AUTH-002 并行（共同依赖 AUTH-001）
- **依赖**：APP-SHELL-001

**范围**：
- `/login`、`/register` 页面 beforeLoad 检查：已登录重定向首页
- SignInForm/SignUpForm 重写：Card 布局、trade-mind 品牌标题、Alert 错误展示
- SignUpForm 新增确认密码字段

**验收标准**：
- [x] 注册成功后重定向 `/settings`
- [x] 登录成功后重定向首页
- [x] 表单错误（邮箱已存在、密码错误）有明确 Alert 提示
- [x] 提交中 Button 为 loading 状态

**完成日期**: 2026-06-22

---

## [x] AUTH-004：前端 — 设置页 API Key 绑定 UI

- **任务类型**：feature
- **执行角色**：frontend-engineer
- **风险等级**：low
- **QA 策略**：required
- **并行策略**：serial
- **依赖**：AUTH-002、AUTH-003、APP-SHELL-001

**范围**：
- 实现 `/settings` 页绑定/解绑 UI
- 调用 `trpc.apiKey.bind`、`trpc.apiKey.unbind`、`trpc.apiKey.getStatus`
- 绑定成功后通过 `queryClient.invalidateQueries` 更新 AppContext `apiKeyBound`
- `_app/route.tsx` 接入 `trpc.apiKey.getStatus`（enabled 依赖 isLoggedIn）

**验收标准**：
- [x] 绑定成功展示 UID（脱敏），Sonner toast 提示
- [x] 绑定失败展示错误原因（Alert）
- [x] 解绑后页面状态重置
- [x] 全局未绑定横幅在绑定成功后消失（query invalidation 触发）

**QA 报告**: `.wave/qa/auth/AUTH-001-004-QA.md` — PASSED
**完成日期**: 2026-06-22
