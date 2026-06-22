import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@trade-mind/ui/components/sonner";

import { ThemeProvider } from "@/components/theme-provider";
import type { trpc } from "@/utils/trpc";

import "../index.css";

export interface RouterAppContext {
	queryClient: QueryClient;
	trpc: typeof trpc;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{ title: "trade-mind" },
			{ name: "description", content: "个人加密货币交易助手" },
		],
		links: [{ rel: "icon", href: "/favicon.ico" }],
	}),
	notFoundComponent: NotFoundPage,
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="trade-mind-theme"
			>
				<Outlet />
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
		</>
	);
}

function NotFoundPage() {
	return (
		<div className="flex h-svh flex-col items-center justify-center gap-4">
			<h1 className="font-semibold text-2xl">404 · 页面不存在</h1>
			<a className="text-muted-foreground text-xs underline" href="/">
				返回首页
			</a>
		</div>
	);
}
