# MODULE: app-shell（保留技术模块）— 应用骨架

> 技术模块 | 优先级：P0（工程前置）| 状态：PENDING

## 业务职责

全局信息架构、路由配置、导航结构、认证守卫、全局布局。

## 生成时机

P4–P7 所有业务模块同阶段完成后聚合生成；P8 阶段生成工程前置任务 APP-SHELL-001。

## 不作为业务模块上游

app-shell 不是任何业务模块的文档上游，由各业务模块的 UI/Arch 聚合而来。

## 页面路由结构（待 P5 后确认）

```
/                     → 首页（行情调研）
/alpha                → Alpha 项目跟踪
/orders               → 订单复盘
/analysis             → 资金曲线分析
/settings             → 设置（API Key 绑定）
/login                → 登录
/register             → 注册
```

## 阶段状态

| 阶段 | 状态 | 文件 |
|---|---|---|
| Design | PENDING | DESIGN.md |
| UI | PENDING | UI.md |
| Arch | PENDING | ARCH.md |
| Spec | PENDING | SPEC.md |
| Tasks | PENDING | TASKS.md |
