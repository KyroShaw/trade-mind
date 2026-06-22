import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@trade-mind/ui/components/badge";
import { Button } from "@trade-mind/ui/components/button";
import { Skeleton } from "@trade-mind/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@trade-mind/ui/components/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@trade-mind/ui/components/tooltip";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/alpha")({
	component: AlphaPage,
});

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AlphaProject {
	change7dPercent: string | null;
	change30dPercent: string | null;
	id: string;
	isBottomConsolidation: boolean;
	name: string;
	price: string | null;
	symbol: string;
	updatedAt: string;
	volatility7d: string | null;
}

interface WatchlistProject extends AlphaProject {
	addedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatChange(value: string | null): {
	label: string;
	positive: boolean;
} {
	if (!value) {
		return { label: "—", positive: false };
	}
	const n = Number(value);
	const positive = n >= 0;
	return {
		label: `${positive ? "↑" : "↓"} ${Math.abs(n).toFixed(2)}%`,
		positive,
	};
}

function formatPrice(value: string | null): string {
	if (!value) {
		return "—";
	}
	const n = Number(value);
	if (n < 0.01) {
		return `$${n.toFixed(6)}`;
	}
	if (n < 1) {
		return `$${n.toFixed(4)}`;
	}
	return `$${n.toFixed(2)}`;
}

function formatDate(value: string): string {
	return new Date(value).toLocaleDateString("zh-CN", {
		month: "2-digit",
		day: "2-digit",
	});
}

// ─── Bottom Badge + Tooltip ────────────────────────────────────────────────────

function BottomBadge({ project }: { project: AlphaProject }) {
	if (!project.isBottomConsolidation) {
		return null;
	}

	const change30d = project.change30dPercent
		? Number(project.change30dPercent).toFixed(1)
		: "—";
	const vol7d = project.volatility7d
		? Number(project.volatility7d).toFixed(1)
		: "—";

	return (
		<Tooltip>
			<TooltipTrigger>
				<Badge variant="warning">底部候选</Badge>
			</TooltipTrigger>
			<TooltipContent className="whitespace-pre text-left leading-relaxed">
				{`30日跌幅：${change30d}%（> 30% 阈值）\n7日波动：${vol7d}%（< 10% 阈值）\n→ 符合底部盘整判断`}
			</TooltipContent>
		</Tooltip>
	);
}

// ─── Watch Button ──────────────────────────────────────────────────────────────

function WatchButton({
	isLoggedIn,
	isWatching,
	onAdd,
	onRemove,
	projectId,
	projectName,
}: {
	isLoggedIn: boolean;
	isWatching: boolean;
	onAdd: (projectId: string) => void;
	onRemove: (projectId: string) => void;
	projectId: string;
	projectName: string;
}) {
	const handleClick = () => {
		if (!isLoggedIn) {
			toast.error("请先登录后再关注");
			return;
		}
		if (isWatching) {
			onRemove(projectId);
		} else {
			onAdd(projectId);
		}
	};

	return (
		<Button
			aria-label={
				isWatching ? `取消关注 ${projectName}` : `关注 ${projectName}`
			}
			onClick={handleClick}
			size="xs"
			variant={isWatching ? "secondary" : "outline"}
		>
			{isWatching ? "✓ 已关注" : "+ 关注"}
		</Button>
	);
}

// ─── Table Skeleton ────────────────────────────────────────────────────────────

function TableSkeleton() {
	return (
		<div className="mt-3 flex flex-col gap-2">
			{Array.from({ length: 6 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
				<Skeleton className="h-10 w-full" key={i} />
			))}
		</div>
	);
}

// ─── All Projects Tab ──────────────────────────────────────────────────────────

function AllProjectsTab({
	isLoggedIn,
	watchlistIds,
	onAdd,
	onRemove,
}: {
	isLoggedIn: boolean;
	watchlistIds: Set<string>;
	onAdd: (projectId: string) => void;
	onRemove: (projectId: string) => void;
}) {
	const { data, isLoading } = useQuery(
		trpc.alpha.list.queryOptions({ filter: "all" })
	);

	const updatedAt = (data as AlphaProject[] | undefined)?.[0]?.updatedAt;

	return (
		<div className="mt-3">
			{updatedAt && (
				<p className="mb-3 text-muted-foreground text-xs">
					更新于{" "}
					{new Date(updatedAt).toLocaleString("zh-CN", {
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</p>
			)}

			{isLoading && <TableSkeleton />}

			{!isLoading && (!data || data.length === 0) && (
				<p className="py-8 text-center text-muted-foreground text-xs">
					暂无 Alpha 项目数据
				</p>
			)}

			{!isLoading && data && data.length > 0 && (
				<div className="overflow-x-auto">
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b text-left text-muted-foreground">
								<th className="pr-4 pb-2 font-medium">项目</th>
								<th className="pr-4 pb-2 text-right font-medium">价格</th>
								<th className="pr-4 pb-2 text-right font-medium">7日涨跌</th>
								<th className="pr-4 pb-2 text-right font-medium">30日涨跌</th>
								<th className="pr-4 pb-2 font-medium">状态</th>
								<th className="pb-2 text-right font-medium">操作</th>
							</tr>
						</thead>
						<tbody>
							{(data as AlphaProject[]).map((project) => {
								const change7d = formatChange(project.change7dPercent);
								const change30d = formatChange(project.change30dPercent);
								return (
									<tr
										className="border-b last:border-0 hover:bg-muted/30"
										key={project.id}
									>
										<td className="py-2.5 pr-4">
											<div className="flex flex-col">
												<span className="font-medium uppercase">
													{project.symbol}
												</span>
												<span className="text-[10px] text-muted-foreground">
													{project.name}
												</span>
											</div>
										</td>
										<td className="py-2.5 pr-4 text-right tabular-nums">
											{formatPrice(project.price)}
										</td>
										<td
											className={`py-2.5 pr-4 text-right tabular-nums ${change7d.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
										>
											{change7d.label}
										</td>
										<td
											className={`py-2.5 pr-4 text-right tabular-nums ${change30d.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
										>
											{change30d.label}
										</td>
										<td className="py-2.5 pr-4">
											<BottomBadge project={project} />
										</td>
										<td className="py-2.5 text-right">
											<WatchButton
												isLoggedIn={isLoggedIn}
												isWatching={watchlistIds.has(project.id)}
												onAdd={onAdd}
												onRemove={onRemove}
												projectId={project.id}
												projectName={project.name}
											/>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

// ─── Watchlist Tab ─────────────────────────────────────────────────────────────

function WatchlistTab({
	isLoggedIn,
	onRemove,
}: {
	isLoggedIn: boolean;
	onRemove: (projectId: string) => void;
}) {
	const { data, isLoading } = useQuery({
		...trpc.alpha.getWatchlist.queryOptions(),
		enabled: isLoggedIn,
	});

	if (!isLoggedIn) {
		return (
			<p className="py-8 text-center text-muted-foreground text-xs">
				请先登录以查看关注列表
			</p>
		);
	}

	return (
		<div className="mt-3">
			{isLoading && <TableSkeleton />}

			{!isLoading && (!data || data.length === 0) && (
				<p className="py-8 text-center text-muted-foreground text-xs">
					暂无关注项目，去全部项目中添加
				</p>
			)}

			{!isLoading && data && data.length > 0 && (
				<div className="overflow-x-auto">
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b text-left text-muted-foreground">
								<th className="pr-4 pb-2 font-medium">项目</th>
								<th className="pr-4 pb-2 text-right font-medium">价格</th>
								<th className="pr-4 pb-2 text-right font-medium">7日涨跌</th>
								<th className="pr-4 pb-2 text-right font-medium">30日涨跌</th>
								<th className="pr-4 pb-2 text-right font-medium">关注时间</th>
								<th className="pb-2 text-right font-medium">操作</th>
							</tr>
						</thead>
						<tbody>
							{(data as WatchlistProject[]).map((project) => {
								const change7d = formatChange(project.change7dPercent);
								const change30d = formatChange(project.change30dPercent);
								return (
									<tr
										className="border-b last:border-0 hover:bg-muted/30"
										key={project.id}
									>
										<td className="py-2.5 pr-4">
											<div className="flex flex-col">
												<span className="font-medium uppercase">
													{project.symbol}
												</span>
												<span className="text-[10px] text-muted-foreground">
													{project.name}
												</span>
											</div>
										</td>
										<td className="py-2.5 pr-4 text-right tabular-nums">
											{formatPrice(project.price)}
										</td>
										<td
											className={`py-2.5 pr-4 text-right tabular-nums ${change7d.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
										>
											{change7d.label}
										</td>
										<td
											className={`py-2.5 pr-4 text-right tabular-nums ${change30d.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
										>
											{change30d.label}
										</td>
										<td className="py-2.5 pr-4 text-right text-muted-foreground">
											{formatDate(project.addedAt)}
										</td>
										<td className="py-2.5 text-right">
											<Button
												aria-label={`取消关注 ${project.name}`}
												onClick={() => onRemove(project.id)}
												size="xs"
												variant="ghost"
											>
												取消
											</Button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function AlphaPage() {
	const { data: sessionData } = authClient.useSession();
	const isLoggedIn = !!sessionData?.session;

	const { data: watchlistData } = useQuery({
		...trpc.alpha.getWatchlist.queryOptions(),
		enabled: isLoggedIn,
	});

	const watchlistIds = new Set(
		(watchlistData as WatchlistProject[] | undefined)?.map((p) => p.id) ?? []
	);

	const addMutation = useMutation({
		...trpc.alpha.addToWatchlist.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.alpha.getWatchlist.queryKey(),
			});
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const removeMutation = useMutation({
		...trpc.alpha.removeFromWatchlist.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.alpha.getWatchlist.queryKey(),
			});
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const handleAdd = (projectId: string) => {
		addMutation.mutate({ projectId });
	};

	const handleRemove = (projectId: string) => {
		removeMutation.mutate({ projectId });
	};

	return (
		<div className="p-6">
			<h1 className="font-semibold text-lg">Alpha 项目跟踪</h1>
			<p className="mt-0.5 text-muted-foreground text-xs">
				Binance Alpha 项目列表与底部盘整标记
			</p>
			<Tabs className="mt-4" defaultValue="all">
				<TabsList>
					<TabsTrigger value="all">全部项目</TabsTrigger>
					<TabsTrigger value="watchlist">我的关注</TabsTrigger>
				</TabsList>
				<TabsContent value="all">
					<AllProjectsTab
						isLoggedIn={isLoggedIn}
						onAdd={handleAdd}
						onRemove={handleRemove}
						watchlistIds={watchlistIds}
					/>
				</TabsContent>
				<TabsContent value="watchlist">
					<WatchlistTab isLoggedIn={isLoggedIn} onRemove={handleRemove} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
