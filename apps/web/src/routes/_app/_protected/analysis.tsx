import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@trade-mind/ui/components/alert";
import { Button } from "@trade-mind/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@trade-mind/ui/components/card";
import { Input } from "@trade-mind/ui/components/input";
import { Label } from "@trade-mind/ui/components/label";
import { Skeleton } from "@trade-mind/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@trade-mind/ui/components/tabs";
import {
	AlertTriangle,
	ChevronDown,
	ChevronUp,
	TrendingUp,
	X,
} from "lucide-react";
import { useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/_protected/analysis")({
	component: AnalysisPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Granularity = "day" | "week";

// ─── Data hooks ─────────────────────────────────────────────────────────────

function useCurveQuery(granularity: Granularity) {
	return useQuery(trpc.analysis.getCurve.queryOptions({ granularity }));
}

function useSummaryQuery() {
	return useQuery(trpc.analysis.getSummary.queryOptions());
}

function useAlertQuery() {
	return useQuery({
		...trpc.analysis.getAlert.queryOptions(),
		refetchInterval: 60_000,
	});
}

// ─── Page ────────────────────────────────────────────────────────────────────

function AnalysisPage() {
	const [granularity, setGranularity] = useState<Granularity>("day");
	const [alertDismissed, setAlertDismissed] = useState(false);

	const curveQuery = useCurveQuery(granularity);
	const summaryQuery = useSummaryQuery();
	const alertQuery = useAlertQuery();

	const showAlert =
		!alertDismissed &&
		alertQuery.data?.triggered === true &&
		alertQuery.data.type !== null;

	return (
		<div className="space-y-4 p-6">
			{/* Alert banner */}
			{showAlert && alertQuery.data && (
				<AlertBanner
					aiAnalysis={alertQuery.data.aiAnalysis}
					onDismiss={() => setAlertDismissed(true)}
					streakCount={alertQuery.data.streakCount}
					type={alertQuery.data.type as "loss" | "win"}
				/>
			)}

			{/* Page header */}
			<div>
				<h1 className="font-semibold text-lg">资金曲线分析</h1>
				<p className="mt-0.5 text-muted-foreground text-xs">
					账户盈亏曲线与风险预警
				</p>
			</div>

			{/* Summary cards */}
			<SummarySection
				isLoading={summaryQuery.isLoading}
				summary={summaryQuery.data}
			/>

			{/* Chart */}
			<Card>
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm">盈亏曲线</CardTitle>
						<Tabs
							onValueChange={(v) => setGranularity(v as Granularity)}
							value={granularity}
						>
							<TabsList>
								<TabsTrigger value="day">按天</TabsTrigger>
								<TabsTrigger value="week">按周</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				</CardHeader>
				<CardContent>
					<CurveChart
						data={curveQuery.data ?? []}
						isLoading={curveQuery.isLoading}
					/>
				</CardContent>
			</Card>

			{/* AI alert analysis detail (only when triggered) */}
			{alertQuery.data?.triggered && alertQuery.data.aiAnalysis && (
				<AiAnalysisCard
					aiAnalysis={alertQuery.data.aiAnalysis}
					streakCount={alertQuery.data.streakCount}
					type={alertQuery.data.type as "loss" | "win"}
				/>
			)}

			{/* Alert settings (collapsible) */}
			<AlertSettingsSection />
		</div>
	);
}

// ─── Alert banner ─────────────────────────────────────────────────────────────

function AlertBanner({
	type,
	streakCount,
	aiAnalysis,
	onDismiss,
}: {
	aiAnalysis: string | null;
	onDismiss: () => void;
	streakCount: number;
	type: "loss" | "win";
}) {
	const isLoss = type === "loss";
	const variant = isLoss ? "destructive" : "warning";
	const label = isLoss
		? `风险预警：检测到连续 ${streakCount} 笔亏损，建议冷静复盘`
		: `盈利提醒：检测到连续 ${streakCount} 笔盈利，注意仓位管理`;

	return (
		<Alert className="relative pr-10" variant={variant}>
			<AlertTriangle className="size-4 shrink-0" />
			<div className="min-w-0 flex-1">
				<AlertTitle>{label}</AlertTitle>
				{aiAnalysis && (
					<AlertDescription className="mt-1 line-clamp-2">
						{aiAnalysis}
					</AlertDescription>
				)}
			</div>
			<button
				aria-label="关闭预警"
				className="absolute top-3 right-3 opacity-60 transition-opacity hover:opacity-100"
				onClick={onDismiss}
				type="button"
			>
				<X className="size-4" />
			</button>
		</Alert>
	);
}

// ─── Summary section ──────────────────────────────────────────────────────────

interface SummaryData {
	avgPnlRatio: number;
	totalPnl: number;
	winRate: number;
}

function SummarySection({
	isLoading,
	summary,
}: {
	isLoading: boolean;
	summary: SummaryData | undefined;
}) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-3 gap-3">
				{Array.from({ length: 3 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
					<Skeleton className="h-20 w-full" key={i} />
				))}
			</div>
		);
	}

	const totalPnl = summary?.totalPnl ?? 0;
	const winRate = summary?.winRate ?? 0;
	const avgPnlRatio = summary?.avgPnlRatio ?? 0;

	const pnlSign = totalPnl >= 0 ? "+" : "";
	const pnlColor =
		totalPnl >= 0
			? "text-emerald-600 dark:text-emerald-400"
			: "text-red-500 dark:text-red-400";

	return (
		<div className="grid grid-cols-3 gap-3">
			<Card>
				<CardContent className="p-4">
					<p className="text-muted-foreground text-xs">总盈亏</p>
					<p className={`mt-1 font-semibold text-base ${pnlColor}`}>
						{pnlSign}${Math.abs(totalPnl).toFixed(2)}
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="p-4">
					<p className="text-muted-foreground text-xs">胜率</p>
					<p className="mt-1 font-semibold text-base">
						{(winRate * 100).toFixed(1)}%
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="p-4">
					<p className="text-muted-foreground text-xs">平均盈亏比</p>
					<p className="mt-1 font-semibold text-base">
						{avgPnlRatio.toFixed(2)}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Curve chart ──────────────────────────────────────────────────────────────

interface CurvePoint {
	cumulativePnl: number;
	dailyPnl: number;
	date: string;
}

function CurveChart({
	data,
	isLoading,
}: {
	data: CurvePoint[];
	isLoading: boolean;
}) {
	if (isLoading) {
		return <Skeleton className="h-56 w-full" />;
	}

	if (data.length === 0) {
		return (
			<div className="flex h-56 flex-col items-center justify-center text-center">
				<TrendingUp className="mb-2 size-8 text-muted-foreground/40" />
				<p className="text-muted-foreground text-sm">暂无订单数据</p>
				<p className="mt-1 text-muted-foreground text-xs">
					完成你的第一笔交易后，盈亏曲线将在此显示
				</p>
			</div>
		);
	}

	return (
		<div aria-label="盈亏趋势折线图" className="h-56 w-full" role="img">
			<ResponsiveContainer height="100%" width="100%">
				<LineChart
					data={data}
					margin={{ bottom: 0, left: 0, right: 8, top: 4 }}
				>
					<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
					<XAxis
						dataKey="date"
						tick={{ fontSize: 10 }}
						tickFormatter={(v: string) => v.slice(5)}
						tickLine={false}
					/>
					<YAxis
						tick={{ fontSize: 10 }}
						tickFormatter={(v: number) => `$${v.toFixed(0)}`}
						tickLine={false}
						width={56}
					/>
					<Tooltip content={<CurveTooltip />} />
					<Line
						dataKey="cumulativePnl"
						dot={false}
						name="累计盈亏"
						stroke="#3b82f6"
						strokeWidth={2}
						type="monotone"
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
	payload: CurvePoint;
}

interface TooltipProps {
	active?: boolean;
	label?: string;
	payload?: TooltipPayloadItem[];
}

function CurveTooltip({ active, label, payload }: TooltipProps) {
	if (!(active && payload) || payload.length === 0) {
		return null;
	}

	const point = payload[0]?.payload;
	if (!point) {
		return null;
	}

	const dailySign = point.dailyPnl >= 0 ? "+" : "";
	const cumulativeSign = point.cumulativePnl >= 0 ? "+" : "";

	return (
		<div className="rounded-none border bg-background p-2 text-xs shadow-md">
			<p className="mb-1 font-medium">{label}</p>
			<p>
				当日盈亏：
				<span
					className={
						point.dailyPnl >= 0
							? "text-emerald-600 dark:text-emerald-400"
							: "text-red-500 dark:text-red-400"
					}
				>
					{dailySign}${point.dailyPnl.toFixed(2)}
				</span>
			</p>
			<p>
				累计盈亏：
				<span
					className={
						point.cumulativePnl >= 0
							? "text-emerald-600 dark:text-emerald-400"
							: "text-red-500 dark:text-red-400"
					}
				>
					{cumulativeSign}${point.cumulativePnl.toFixed(2)}
				</span>
			</p>
		</div>
	);
}

// ─── AI analysis card ─────────────────────────────────────────────────────────

function AiAnalysisCard({
	type,
	streakCount,
	aiAnalysis,
}: {
	aiAnalysis: string;
	streakCount: number;
	type: "loss" | "win";
}) {
	const isLoss = type === "loss";
	const title = isLoss
		? `连续亏损 ${streakCount} 笔 — AI 分析`
		: `连续盈利 ${streakCount} 笔 — AI 分析`;

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
					{aiAnalysis}
				</p>
			</CardContent>
		</Card>
	);
}

// ─── Alert settings section ───────────────────────────────────────────────────

function AlertSettingsSection() {
	const queryClient = useQueryClient();
	const [expanded, setExpanded] = useState(false);
	const [lossThreshold, setLossThreshold] = useState(3);
	const [winThreshold, setWinThreshold] = useState(5);

	const mutation = useMutation(
		trpc.analysis.updateAlertSettings.mutationOptions({
			onSuccess: () => {
				toast.success("预警设置已保存");
				queryClient.invalidateQueries(trpc.analysis.getAlert.queryFilter());
			},
			onError: (err) => toast.error(err.message),
		})
	);

	const handleSave = () => {
		mutation.mutate({ lossThreshold, winThreshold });
	};

	return (
		<Card>
			<button
				className="w-full text-left"
				onClick={() => setExpanded((v) => !v)}
				type="button"
			>
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm">预警设置</CardTitle>
						{expanded ? (
							<ChevronUp className="size-4 text-muted-foreground" />
						) : (
							<ChevronDown className="size-4 text-muted-foreground" />
						)}
					</div>
				</CardHeader>
			</button>
			{expanded && (
				<CardContent className="space-y-4">
					<div className="space-y-1.5">
						<Label className="text-xs" htmlFor="loss-threshold">
							连续亏损触发阈值（2–10）
						</Label>
						<Input
							className="w-24"
							id="loss-threshold"
							max={10}
							min={2}
							onChange={(e) => setLossThreshold(Number(e.target.value))}
							type="number"
							value={lossThreshold}
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs" htmlFor="win-threshold">
							连续盈利触发阈值（2–10）
						</Label>
						<Input
							className="w-24"
							id="win-threshold"
							max={10}
							min={2}
							onChange={(e) => setWinThreshold(Number(e.target.value))}
							type="number"
							value={winThreshold}
						/>
					</div>
					<Button disabled={mutation.isPending} onClick={handleSave} size="sm">
						{mutation.isPending ? "保存中..." : "保存设置"}
					</Button>
				</CardContent>
			)}
		</Card>
	);
}
