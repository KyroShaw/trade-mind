import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
	component: MarketResearchPage,
});

function MarketResearchPage() {
	return (
		<div className="p-6">
			<h1 className="font-semibold text-lg">行情调研</h1>
			<p className="mt-1 text-muted-foreground text-xs">
				板块轮动感知与宏观消息追踪 — 功能将在 MARKET-003 任务实现
			</p>
			<div
				aria-hidden="true"
				className="mt-6 h-64 rounded-none border border-dashed"
			/>
		</div>
	);
}
