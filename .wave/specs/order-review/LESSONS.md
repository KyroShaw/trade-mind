# LESSONS — order-review

## 2026-06-22 — order-review / ORDER-005 前端复盘页

**Blob URL revocation 时序（Firefox）**：`URL.createObjectURL` + `a.click()` 后不能同步调用 `URL.revokeObjectURL`。Firefox 在当前 JS task 结束后才读取 Blob URL，同步撤销会导致下载失败。修复：`setTimeout(() => URL.revokeObjectURL(url), 100)`。

**AI 报告 Markdown 解析的 preamble 问题**：使用 `/^## /m` 分割 AI 输出时，若模型在第一个 `##` 之前输出了引导文字（即使 prompt 明确禁止），`split().filter(Boolean)` 会把前文当作一个"章节"，导致标题渲染乱码。修复：`text.slice(text.search(SECTION_SPLIT_RE))` 先定位第一个标题再分割。

**受控输入从异步数据初始化的惯用模式**：`useState("") + useEffect(一次性 init flag)` 是可行方案，但需要 biome-ignore 抑制警告。TanStack Router 在路由切换时会完整卸载组件，所以"导航回来覆盖用户输入"的担忧在此场景不成立。

**tRPC queryFilter 带参数调用**：`trpc.orders.get.queryFilter({ orderId })` 合法，第一个参数为 input，生成精确 key `[['orders','get'], {input:{orderId}, type:'query'}]`，只失效该订单的缓存条目，不影响其他订单。
