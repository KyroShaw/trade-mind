import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Button } from "@trade-mind/ui/components/button";
import { createContext, useContext } from "react";

import Sidebar from "@/components/layout/sidebar";

interface AppContextValue {
	apiKeyBound: boolean;
}

const AppContext = createContext<AppContextValue>({ apiKeyBound: false });

export const useAppContext = () => useContext(AppContext);

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	// apiKeyBound 占位 false — AUTH-004 任务完成后将接入 trpc.apiKey.getStatus()
	const apiKeyBound = false;

	return (
		<AppContext.Provider value={{ apiKeyBound }}>
			<div className="flex h-svh overflow-hidden">
				<Sidebar />
				<div className="flex flex-1 flex-col overflow-hidden">
					{!apiKeyBound && <ApiKeyBanner />}
					<main className="flex-1 overflow-auto">
						<Outlet />
					</main>
				</div>
			</div>
		</AppContext.Provider>
	);
}

function ApiKeyBanner() {
	return (
		<div
			className="flex items-center justify-between border-b bg-amber-50 px-4 py-2 text-amber-800 text-xs dark:bg-amber-950/30 dark:text-amber-400"
			role="alert"
		>
			<span>⚠️ 绑定 Binance API 以解锁完整功能</span>
			<Link to="/settings">
				<Button size="xs" variant="outline">
					立即绑定 →
				</Button>
			</Link>
		</div>
	);
}
