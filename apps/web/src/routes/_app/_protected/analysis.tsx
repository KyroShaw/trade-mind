import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_protected/analysis")({
	component: AnalysisPage,
});

function AnalysisPage() {
	return (
		<div className="p-6">
			<h1 className="font-semibold text-lg">资金曲线分析</h1>
			<p className="mt-1 text-muted-foreground text-xs">
				账户盈亏曲线与风险预警 — 功能将在 ANALYSIS-003 任务实现
			</p>
			<div
				aria-hidden="true"
				className="mt-6 h-64 rounded-none border border-dashed"
			/>
		</div>
	);
}
