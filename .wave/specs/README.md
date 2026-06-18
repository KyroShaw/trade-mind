# specs/ — 模块规格目录

> 每个功能模块在此目录下独立建文件夹，例如 `.wave/specs/checkout/`。
> 由 `/sw-plan` 生成，由 `/sw-run` 消费。

## 目录结构（示例）

```
specs/
  {module}/
    SPEC.md        # 模块规格（接口、数据结构、业务规则）
    DESIGN.md      # 产品/交互设计
    UI.md          # 界面设计（由 /sw-ui 生成）
    ARCH.md        # 架构设计
    TASKS.md       # 任务列表
    QA.md          # QA 报告
```
