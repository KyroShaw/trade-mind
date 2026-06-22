import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_protected/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<div className="p-6">
			<h1 className="font-semibold text-lg">设置</h1>
			<p className="mt-1 text-muted-foreground text-xs">
				Binance API Key 绑定与账户设置 — 功能将在 AUTH-004 任务实现
			</p>
			<div
				aria-hidden="true"
				className="mt-6 h-64 rounded-none border border-dashed"
			/>
		</div>
	);
}
