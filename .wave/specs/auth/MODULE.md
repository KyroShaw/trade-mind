# MODULE: auth — 账号与 API 绑定

> PRD 来源：F-001 | 优先级：P0 | 状态：MISSING

## 业务职责

用户注册/登录、Binance API Key 绑定与加密存储。

## 边界

- **包含**：注册、登录、API Key 绑定页、个人设置
- **不含**：具体业务数据展示

## 依赖

- 上游：无
- 下游消费者：market-research、alpha-tracker、order-review、fund-analysis

## 关键验收标准（来自 PRD）

- AC-001-1：用户可完成注册并登录
- AC-001-2：绑定 API Key 后可成功拉取 Binance 账户基本信息
- AC-001-3：API Key 不以明文出现在任何响应或日志中

## 阶段状态

| 阶段 | 状态 | 文件 |
|---|---|---|
| Design | MISSING | DESIGN.md |
| UI | MISSING | UI.md |
| Arch | MISSING | ARCH.md |
| Spec | MISSING | SPEC.md |
| Tasks | MISSING | TASKS.md |
