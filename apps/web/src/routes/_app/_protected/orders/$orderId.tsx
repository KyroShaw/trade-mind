// biome-ignore lint/style/useFilenamingConvention: TanStack Router requires camelCase for route params ($orderId → params.orderId)
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_protected/orders/$orderId")({
	component: OrderDetailPage,
});

function OrderDetailPage() {
	const { orderId } = Route.useParams();

	return (
		<div className="p-6">
			<Link
				className="text-muted-foreground text-xs hover:underline"
				to="/orders"
			>
				← 返回订单列表
			</Link>
			<h1 className="mt-4 font-semibold text-lg">订单详情</h1>
			<p className="mt-1 text-muted-foreground text-xs">
				订单 ID：{orderId} — 详情与复盘报告将在 ORDER-005 任务实现
			</p>
			<div
				aria-hidden="true"
				className="mt-6 h-64 rounded-none border border-dashed"
			/>
		</div>
	);
}
