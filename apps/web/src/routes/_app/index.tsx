import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@trade-mind/ui/components/badge";
import { Button } from "@trade-mind/ui/components/button";
import { Card, CardContent, CardHeader } from "@trade-mind/ui/components/card";
import { Skeleton } from "@trade-mind/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@trade-mind/ui/components/tabs";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/")({
	component: MarketResearchPage,
});

function MarketResearchPage() {
	return (
		<div className="p-6">
			<h1 className="font-semibold text-lg">行情调研</h1>
			<p className="mt-0.5 text-muted-foreground text-xs">
				板块轮动感知与宏观消息追踪
			</p>
			<Tabs className="mt-4" defaultValue="sectors">
				<TabsList>
					<TabsTrigger value="sectors">板块热力</TabsTrigger>
					<TabsTrigger value="news">宏观消息</TabsTrigger>
				</TabsList>
				<TabsContent value="sectors">
					<SectorsTab />
				</TabsContent>
				<TabsContent value="news">
					<NewsTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}

// ─── Sectors Tab ───────────────────────────────────────────────────────────────

interface SectorCoin {
	change24hPercent: string | null;
	id: string;
	name: string;
	price: string | null;
	rank: number;
	sectorId: string;
	symbol: string;
	updatedAt: string;
}

interface Sector {
	coinGeckoId: string;
	coins: SectorCoin[];
	dailyChangePercent: string | null;
	heatScore: number;
	id: string;
	name: string;
	updatedAt: string;
}

function SectorsTab() {
	const { data, isLoading, refetch, isFetching } = useQuery(
		trpc.market.getSectors.queryOptions()
	);

	const updatedAt = data?.[0]?.updatedAt;

	return (
		<div className="mt-3">
			<div className="mb-3 flex items-center justify-between">
				<span className="text-muted-foreground text-xs">
					{updatedAt
						? `更新于 ${new Date(updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`
						: ""}
				</span>
				<Button
					disabled={isFetching}
					onClick={() => refetch()}
					size="xs"
					variant="ghost"
				>
					{isFetching ? "刷新中…" : "↻ 刷新"}
				</Button>
			</div>

			{isLoading && <SectorsSkeleton />}

			{!isLoading && (!data || data.length === 0) && (
				<p className="py-8 text-center text-muted-foreground text-xs">
					暂无板块数据，稍后再试
				</p>
			)}

			{!isLoading && data && data.length > 0 && (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
					{(data as Sector[]).map((sector) => (
						<SectorCard key={sector.id} sector={sector} />
					))}
				</div>
			)}
		</div>
	);
}

function SectorsSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
			{Array.from({ length: 6 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
				<Skeleton className="h-28 w-full" key={i} />
			))}
		</div>
	);
}

function SectorCard({ sector }: { sector: Sector }) {
	const [expanded, setExpanded] = useState(false);
	const change = sector.dailyChangePercent
		? Number(sector.dailyChangePercent)
		: null;
	const isPositive = change !== null && change >= 0;

	return (
		<Card className="rounded-none">
			<CardHeader className="pt-3 pb-1">
				<div className="flex items-start justify-between gap-1">
					<span className="truncate font-medium text-sm">{sector.name}</span>
					{change !== null && (
						<span
							className={`shrink-0 font-semibold text-xs ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
						>
							{isPositive ? "↑" : "↓"} {Math.abs(change).toFixed(2)}%
						</span>
					)}
				</div>
			</CardHeader>
			<CardContent className="pb-3">
				<HeatBar score={sector.heatScore} />
				<button
					aria-expanded={expanded}
					className="mt-2 text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
					onClick={() => setExpanded((v) => !v)}
					type="button"
				>
					{expanded ? "收起龙头" : "展开龙头"}
				</button>
				{expanded && sector.coins.length > 0 && (
					<div className="mt-2 flex flex-col gap-1">
						{sector.coins.map((coin) => (
							<CoinRow coin={coin} key={coin.id} />
						))}
					</div>
				)}
				{expanded && sector.coins.length === 0 && (
					<p className="mt-1 text-[10px] text-muted-foreground">暂无龙头数据</p>
				)}
			</CardContent>
		</Card>
	);
}

function HeatBar({ score }: { score: number }) {
	return (
		<div className="flex items-center gap-2">
			<div
				aria-label="热度"
				aria-valuemax={100}
				aria-valuemin={0}
				aria-valuenow={score}
				className="relative h-1.5 flex-1 overflow-hidden rounded-none bg-muted"
				role="progressbar"
			>
				<div
					className="absolute inset-y-0 left-0 bg-amber-400 dark:bg-amber-500"
					style={{ width: `${score}%` }}
				/>
			</div>
			<span className="w-6 text-right text-[10px] text-muted-foreground tabular-nums">
				{score}
			</span>
		</div>
	);
}

function CoinRow({ coin }: { coin: SectorCoin }) {
	const change = coin.change24hPercent ? Number(coin.change24hPercent) : null;
	const isPos = change !== null && change >= 0;

	return (
		<div className="flex items-center justify-between gap-2 text-[10px]">
			<span className="font-medium uppercase">{coin.symbol}</span>
			{coin.price && (
				<span className="text-muted-foreground">
					${Number(coin.price).toFixed(4)}
				</span>
			)}
			{change !== null && (
				<span
					className={
						isPos ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
					}
				>
					{isPos ? "↑" : "↓"} {Math.abs(change).toFixed(2)}%
				</span>
			)}
		</div>
	);
}

// ─── News Tab ──────────────────────────────────────────────────────────────────

const NEWS_TAGS = ["宏观", "监管", "市场", "macro"];

interface NewsItem {
	aiSummary: string | null;
	createdAt: string;
	externalId: string;
	id: string;
	publishedAt: string;
	source: string;
	tags: string[];
	title: string;
	url: string;
}

function NewsTab() {
	const [selectedTag, setSelectedTag] = useState<string | null>(null);
	const [page, setPage] = useState(1);

	const { data, isLoading } = useQuery(
		trpc.market.getNews.queryOptions({
			tags: selectedTag ? [selectedTag] : undefined,
			page,
		})
	);

	const handleTagChange = (tag: string | null) => {
		setSelectedTag(tag);
		setPage(1);
	};

	return (
		<div className="mt-3">
			<div className="mb-3 flex flex-wrap gap-1.5">
				<button
					className={`rounded-none px-2 py-0.5 font-medium text-[10px] ring-1 ring-inset transition-colors ${
						selectedTag === null
							? "bg-primary text-primary-foreground ring-primary"
							: "bg-transparent text-muted-foreground ring-border hover:text-foreground"
					}`}
					onClick={() => handleTagChange(null)}
					type="button"
				>
					全部
				</button>
				{NEWS_TAGS.map((tag) => (
					<button
						className={`rounded-none px-2 py-0.5 font-medium text-[10px] ring-1 ring-inset transition-colors ${
							selectedTag === tag
								? "bg-primary text-primary-foreground ring-primary"
								: "bg-transparent text-muted-foreground ring-border hover:text-foreground"
						}`}
						key={tag}
						onClick={() => handleTagChange(tag)}
						type="button"
					>
						{tag}
					</button>
				))}
			</div>

			{isLoading && <NewsSkeleton />}

			{!isLoading && (!data || data.length === 0) && (
				<p className="py-8 text-center text-muted-foreground text-xs">
					暂无消息数据
				</p>
			)}

			{!isLoading && data && data.length > 0 && (
				<>
					<div className="flex flex-col gap-2">
						{(data as NewsItem[]).map((item) => (
							<NewsCard item={item} key={item.id} />
						))}
					</div>
					<div className="mt-4 flex items-center justify-between">
						<Button
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
							size="xs"
							variant="outline"
						>
							上一页
						</Button>
						<span className="text-[10px] text-muted-foreground">
							第 {page} 页
						</span>
						<Button
							disabled={data.length < 20}
							onClick={() => setPage((p) => p + 1)}
							size="xs"
							variant="outline"
						>
							下一页
						</Button>
					</div>
				</>
			)}
		</div>
	);
}

function NewsSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			{Array.from({ length: 5 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
				<Skeleton className="h-20 w-full" key={i} />
			))}
		</div>
	);
}

function NewsCard({ item }: { item: NewsItem }) {
	const relativeTime = getRelativeTime(item.publishedAt);

	return (
		<div className="border p-3">
			<div className="mb-1 flex flex-wrap gap-1">
				{item.tags.map((tag) => (
					<Badge key={tag} variant="outline">
						{tag}
					</Badge>
				))}
			</div>
			<p className="font-medium text-sm leading-snug">{item.title}</p>
			{item.aiSummary && (
				<p className="mt-1 text-[11px] text-muted-foreground">
					{item.aiSummary}
				</p>
			)}
			<div className="mt-2 flex items-center justify-between">
				<span className="text-[10px] text-muted-foreground">
					{item.source} · {relativeTime}
				</span>
				<a
					className="text-[10px] text-primary underline underline-offset-2 hover:text-primary/80"
					href={item.url}
					rel="noopener noreferrer"
					target="_blank"
				>
					查看原文 ↗
				</a>
			</div>
		</div>
	);
}

function getRelativeTime(date: string | Date): string {
	const diffMs = Date.now() - new Date(date).getTime();
	const diffMins = Math.floor(diffMs / 60_000);
	if (diffMins < 1) {
		return "刚刚";
	}
	if (diffMins < 60) {
		return `${diffMins} 分钟前`;
	}
	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) {
		return `${diffHours} 小时前`;
	}
	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays} 天前`;
}
