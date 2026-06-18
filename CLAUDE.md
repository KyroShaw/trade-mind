# CLAUDE.md — trade-mind

## 包管理器

```
pnpm@11.7.0（monorepo，pnpm workspaces + Turborepo）
```

## 常用命令

| 用途 | 命令 |
|---|---|
| 全量开发服务 | `pnpm dev` |
| 仅启动前端 | `pnpm dev:web` |
| 仅启动后端 | `pnpm dev:server` |
| 构建 | `pnpm build` |
| 类型检查 | `pnpm check-types` |
| Lint 检查 | `pnpm check` |
| 自动修复 Lint | `pnpm fix` |
| DB Push | `pnpm db:push` |
| DB 迁移 | `pnpm db:migrate` |
| DB Studio | `pnpm db:studio` |
| DB 生成 | `pnpm db:generate` |

## 架构边界

```
apps/
  web/        # React SPA（Vite + TanStack Router + TanStack Query + tRPC + Tailwind CSS）
  server/     # Hono + tRPC server（Node.js / bun）
  fumadocs/   # 文档站（Next.js）

packages/
  api/        # tRPC 路由定义（前后端共享类型）
  auth/       # better-auth 认证配置
  db/         # Drizzle ORM + PostgreSQL schema
  env/        # zod 环境变量验证
  ui/         # 共享 UI 组件库
  config/     # 共享 TypeScript / 工具配置
```

- `packages/api` 是前后端通信唯一契约，不在 app 层直接定义 tRPC 路由
- `packages/db` 是数据层唯一出口，禁止绕过 Drizzle 直接操作 SQL
- `packages/env` 是环境变量唯一来源，禁止直接读取 `process.env`（在 env 包外）
- `apps/web` 是纯客户端 SPA，禁止在其中写服务端逻辑

## AI Coding 规则

- 遵循 Ultracite 代码规范（Biome 驱动），修改代码后运行 `pnpm fix`
- 优先使用已有的 `@trade-mind/*` 包，不重复实现已有能力
- 新增共享类型放 `packages/api`，新增 UI 组件放 `packages/ui`
- 新增 schema 放 `packages/db`，新增环境变量放 `packages/env`

## 禁止操作

- 禁止直接修改 `pnpm-lock.yaml`
- 禁止跨越架构边界（如在 web 直连 DB）
- 禁止读取或提交 `.env` 文件
- 禁止执行生产部署命令
- 禁止安装未经确认的依赖
