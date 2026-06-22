import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@trade-mind/ui/components/badge";
import { Button } from "@trade-mind/ui/components/button";
import { Card, CardContent } from "@trade-mind/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@trade-mind/ui/components/dropdown-menu";
import { Skeleton } from "@trade-mind/ui/components/skeleton";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/_protected/orders/")({
	component: OrdersPage,
});

// ─── Constants ─────────────────────────────────────────────────────────────────

const SYMBOL_OPTIONS = [
	"BTCUSDT",
	"ETHUSDT",
	"BNBUSDT",
	"SOLUSDT",
	"ADAUSDT",
	"XRPUSDT",
	"DOGEUSDT",
	"LINKUSDT",
	"AVAXUSDT",
	"LTCUSDT",
];

const DATE_RANGE_OPTIONS = [
	{ days: 7, label: "最近 7 天" },
	{ days: 30, label: "最近 30 天" },
	{ days: 90, label: "最近 90 天" },
	{ days: undefined, label: "全部时间" },
] as const;

const PNL_OPTIONS = [
	{ label: "盈亏不限", value: "all" },
	{ label: "仅盈利", value: "profit" },
	{ label: "仅亏损", value: "loss" },
] as const;

type PnlFilter = "all" | "loss" | "profit";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatSymbol(symbol: string): string {
	return symbol.endsWith("USDT") ? `${symbol.slice(0, -4)}/USDT` : symbol;
}

function formatDate(date: string | Date): string {
	return new Date(date).toLocaleDateString("zh-CN", {
		month: "2-digit",
		day: "2-digit",
	});
}

function formatPnl(pnl: string, pnlPercent: string): string {
	const n = Number(pnl);
	const p = Number(pnlPercent);
	const sign = n >= 0 ? "+" : "";
	return `${sign}$${Math.abs(n).toFixed(2)} (${sign}${p.toFixed(2)}%)`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function OrdersPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const [symbol, setSymbol] = useState<string | undefined>();
	const [days, setDays] = useState<number | undefined>(90);
	const [pnlFilter, setPnlFilter] = useState<PnlFilter>("all");
	const [page, setPage] = useState(1);
	const [accumulated, setAccumulated] = useState<
		ReturnType<typeof useOrdersQuery>["data"]
	>([]);

	const dateFrom = days
		? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
		: undefined;

	const syncMutation = useMutation(
		trpc.orders.sync.mutationOptions({
			onSuccess: (data) => {
				if (data.count > 0) {
					toast.success(`同步完成，新增 ${data.count} 条订单`);
					queryClient.invalidateQueries(trpc.orders.list.queryFilter());
				}
			},
			onError: (err) => toast.error(err.message),
		})
	);

	const { mutate: triggerSync } = syncMutation;

	// Auto-sync once on mount
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only trigger
	useEffect(() => {
		triggerSync();
	}, []);

	const {
		data: pageData,
		isLoading,
		isFetching,
	} = useOrdersQuery({
		symbol,
		dateFrom,
		page,
	});

	// Accumulate pages; reset on filter change
	const filterKey = `${symbol ?? ""}-${days ?? ""}-${pnlFilter}`;
	const prevFilterKey = useRef(filterKey);
	if (prevFilterKey.current !== filterKey) {
		prevFilterKey.current = filterKey;
		setPage(1);
		setAccumulated([]);
	}

	useEffect(() => {
		if (!pageData) {
			return;
		}
		setAccumulated((prev) =>
			page === 1 ? pageData : [...(prev ?? []), ...pageData]
		);
	}, [pageData, page]);

	const hasMore = (pageData?.length ?? 0) === 20;

	const visibleOrders = (accumulated ?? []).filter((o) => {
		if (pnlFilter === "profit") {
			return Number(o.pnl) > 0;
		}
		if (pnlFilter === "loss") {
			return Number(o.pnl) < 0;
		}
		return true;
	});

	const isFirstLoad =
		isLoading || (syncMutation.isPending && accumulated?.length === 0);

	return (
		<div className="p-6">
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-lg">订单复盘</h1>
					<p className="mt-0.5 text-muted-foreground text-xs">
						已平仓现货订单，AI 辅助复盘
					</p>
				</div>
				<Button
					disabled={syncMutation.isPending}
					onClick={() => triggerSync()}
					size="sm"
					variant="outline"
				>
					{syncMutation.isPending ? "同步中..." : "同步订单"}
				</Button>
			</div>

			{/* Filter bar */}
			<div className="mb-4 flex flex-wrap gap-2">
				<SymbolFilter
					onChange={(v) => {
						setSymbol(v);
						setPage(1);
					}}
					value={symbol}
				/>
				<DateRangeFilter
					onChange={(v) => {
						setDays(v);
						setPage(1);
					}}
					value={days}
				/>
				<PnlFilterSelect
					onChange={(v) => {
						setPnlFilter(v);
						setPage(1);
					}}
					value={pnlFilter}
				/>
			</div>

			{/* Content */}
			<OrdersContent
				hasMore={hasMore}
				isFetching={isFetching}
				isFirstLoad={isFirstLoad}
				isLoading={isLoading}
				isSyncing={syncMutation.isPending}
				onLoadMore={() => setPage((p) => p + 1)}
				onOrderClick={(id) =>
					navigate({ params: { orderId: id }, to: "/orders/$orderId" })
				}
				orders={visibleOrders}
			/>
		</div>
	);
}

// ─── Data hook ─────────────────────────────────────────────────────────────────

function useOrdersQuery({
	symbol,
	dateFrom,
	page,
}: {
	dateFrom: string | undefined;
	page: number;
	symbol: string | undefined;
}) {
	return useQuery(
		trpc.orders.list.queryOptions({
			dateFrom,
			page,
			pageSize: 20,
			symbol,
		})
	);
}

// ─── Orders content (extracted to avoid nested ternary) ───────────────────────

function OrdersContent({
	hasMore,
	isFetching,
	isFirstLoad,
	isLoading,
	isSyncing,
	onLoadMore,
	onOrderClick,
	orders,
}: {
	hasMore: boolean;
	isFetching: boolean;
	isFirstLoad: boolean;
	isLoading: boolean;
	isSyncing: boolean;
	onLoadMore: () => void;
	onOrderClick: (id: string) => void;
	orders: OrderRow[];
}) {
	if (isFirstLoad) {
		return <OrderListSkeleton />;
	}
	if (orders.length === 0) {
		return <EmptyState isSyncing={isSyncing} />;
	}
	return (
		<div className="space-y-2">
			{orders.map((order) => (
				<OrderCard
					key={order.id}
					onClick={() => onOrderClick(order.id)}
					order={order}
				/>
			))}
			{isFetching && !isLoading && <OrderListSkeleton count={2} />}
			{hasMore && !isFetching && (
				<Button className="w-full" onClick={onLoadMore} variant="ghost">
					加载更多
				</Button>
			)}
		</div>
	);
}

// ─── Filter components ─────────────────────────────────────────────────────────

function SymbolFilter({
	value,
	onChange,
}: {
	onChange: (v: string | undefined) => void;
	value: string | undefined;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
				{value ? formatSymbol(value) : "全部交易对"}
				<ChevronDown className="ml-1 size-3" />
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem onClick={() => onChange(undefined)}>
					全部交易对
				</DropdownMenuItem>
				{SYMBOL_OPTIONS.map((s) => (
					<DropdownMenuItem key={s} onClick={() => onChange(s)}>
						{formatSymbol(s)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function DateRangeFilter({
	value,
	onChange,
}: {
	onChange: (v: number | undefined) => void;
	value: number | undefined;
}) {
	const label =
		DATE_RANGE_OPTIONS.find((o) => o.days === value)?.label ?? "时间范围";
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
				{label}
				<ChevronDown className="ml-1 size-3" />
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{DATE_RANGE_OPTIONS.map((o) => (
					<DropdownMenuItem key={o.label} onClick={() => onChange(o.days)}>
						{o.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function PnlFilterSelect({
	value,
	onChange,
}: {
	onChange: (v: PnlFilter) => void;
	value: PnlFilter;
}) {
	const label = PNL_OPTIONS.find((o) => o.value === value)?.label ?? "盈亏";
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
				{label}
				<ChevronDown className="ml-1 size-3" />
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{PNL_OPTIONS.map((o) => (
					<DropdownMenuItem key={o.value} onClick={() => onChange(o.value)}>
						{o.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ─── Order card ─────────────────────────────────────────────────────────────────

interface OrderRow {
	closedAt: Date | string;
	hasReview: boolean;
	id: string;
	pnl: string;
	pnlPercent: string;
	side: "BUY" | "SELL";
	symbol: string;
}

function OrderCard({
	order,
	onClick,
}: {
	onClick: () => void;
	order: OrderRow;
}) {
	const profit = Number(order.pnl) >= 0;
	return (
		<Card
			className="cursor-pointer transition-colors hover:bg-muted/40"
			onClick={onClick}
		>
			<CardContent className="flex items-center justify-between px-4 py-3">
				<div className="flex items-center gap-3">
					<div>
						<span className="font-medium text-sm">
							{formatSymbol(order.symbol)}
						</span>
						<span className="ml-2 text-muted-foreground text-xs">
							{order.side === "SELL" ? "做多" : "做空"}
						</span>
					</div>
					<span className="text-muted-foreground text-xs">
						{formatDate(order.closedAt)}
					</span>
					{order.hasReview && <Badge variant="default">已复盘</Badge>}
				</div>
				<div className="flex items-center gap-2">
					<span
						className={
							profit
								? "font-medium text-emerald-600 text-sm dark:text-emerald-400"
								: "font-medium text-red-500 text-sm dark:text-red-400"
						}
					>
						{profit ? "盈利 " : "亏损 "}
						{formatPnl(order.pnl, order.pnlPercent)}
					</span>
					<span className="text-muted-foreground text-xs">→</span>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Skeletons & empty ─────────────────────────────────────────────────────────

function OrderListSkeleton({ count = 5 }: { count?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: count }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
				<Skeleton className="h-14 w-full" key={i} />
			))}
		</div>
	);
}

function EmptyState({ isSyncing }: { isSyncing: boolean }) {
	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<p className="text-muted-foreground text-sm">
				{isSyncing ? "正在从 Binance 同步订单..." : "暂无已平仓订单"}
			</p>
			{!isSyncing && (
				<p className="mt-1 text-muted-foreground text-xs">
					开始你的第一笔交易，或调整筛选条件
				</p>
			)}
		</div>
	);
}
