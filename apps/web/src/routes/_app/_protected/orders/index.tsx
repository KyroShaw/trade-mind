import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_protected/orders/")({
	component: OrdersPage,
});

function OrdersPage() {
	return (
		<div className="p-6">
			<h1 className="font-semibold text-lg">订单复盘</h1>
			<p className="mt-1 text-muted-foreground text-xs">
				已平仓订单列表与 AI 复盘报告 — 功能将在 ORDER-004 任务实现
			</p>
			<div
				aria-hidden="true"
				className="mt-6 h-64 rounded-none border border-dashed"
			/>
		</div>
	);
}
