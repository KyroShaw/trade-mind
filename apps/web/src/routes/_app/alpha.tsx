import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/alpha")({
	component: AlphaPage,
});

function AlphaPage() {
	return (
		<div className="p-6">
			<h1 className="font-semibold text-lg">Alpha 项目跟踪</h1>
			<p className="mt-1 text-muted-foreground text-xs">
				Binance Alpha 项目列表与底部盘整标记 — 功能将在 ALPHA-003 任务实现
			</p>
			<div
				aria-hidden="true"
				className="mt-6 h-64 rounded-none border border-dashed"
			/>
		</div>
	);
}
