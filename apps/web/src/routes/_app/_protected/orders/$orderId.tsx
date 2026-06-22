// biome-ignore lint/style/useFilenamingConvention: TanStack Router requires camelCase for route params ($orderId → params.orderId)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@trade-mind/ui/components/badge";
import { Button } from "@trade-mind/ui/components/button";
import { Card, CardContent } from "@trade-mind/ui/components/card";
import { Label } from "@trade-mind/ui/components/label";
import { Skeleton } from "@trade-mind/ui/components/skeleton";
import { Textarea } from "@trade-mind/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/_protected/orders/$orderId")({
	component: OrderDetailPage,
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatSymbol(symbol: string): string {
	return symbol.endsWith("USDT") ? `${symbol.slice(0, -4)}/USDT` : symbol;
}

function formatDateTime(date: string | Date): string {
	return new Date(date).toLocaleString("zh-CN", {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatPnl(pnl: string, pnlPercent: string): string {
	const n = Number(pnl);
	const p = Number(pnlPercent);
	const sign = n >= 0 ? "+" : "";
	return `${sign}$${Math.abs(n).toFixed(2)} (${sign}${p.toFixed(2)}%)`;
}

function generateBtnLabel(isGenerating: boolean, hasReport: boolean): string {
	if (isGenerating) {
		return "AI 正在分析...";
	}
	return hasReport ? "重新生成复盘" : "生成复盘报告";
}

function downloadMarkdown(content: string, filename: string): void {
	const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	// Defer revocation — Firefox reads the blob URL after the current JS task
	setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ─── Markdown section parser ───────────────────────────────────────────────────

const SECTION_SPLIT_RE = /^## /m;

interface ReportSection {
	content: string;
	title: string;
}

function parseReportSections(text: string): ReportSection[] {
	// Strip any preamble before the first heading so it doesn't become a spurious section
	const firstHeading = text.search(SECTION_SPLIT_RE);
	const body = firstHeading >= 0 ? text.slice(firstHeading) : text;
	const rawSections = body.split(SECTION_SPLIT_RE).filter(Boolean);
	return rawSections.map((section) => {
		const newlineIdx = section.indexOf("\n");
		if (newlineIdx === -1) {
			return { title: section.trim(), content: "" };
		}
		return {
			title: section.slice(0, newlineIdx).trim(),
			content: section.slice(newlineIdx + 1).trim(),
		};
	});
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function OrderDetailPage() {
	const { orderId } = Route.useParams();
	const queryClient = useQueryClient();

	const { data: orderData, isLoading } = useQuery(
		trpc.orders.get.queryOptions({ orderId })
	);

	const [entryLogic, setEntryLogic] = useState("");
	const [exitLogic, setExitLogic] = useState("");
	const [initialized, setInitialized] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-time init from server data
	useEffect(() => {
		if (orderData && !initialized) {
			setEntryLogic(orderData.review?.entryLogic ?? "");
			setExitLogic(orderData.review?.exitLogic ?? "");
			setInitialized(true);
		}
	}, [orderData]);

	const generateMutation = useMutation(
		trpc.orders.generateReview.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.orders.get.queryFilter({ orderId }));
			},
			onError: (err) => toast.error(err.message),
		})
	);

	if (isLoading) {
		return <OrderDetailSkeleton />;
	}

	if (!orderData) {
		return (
			<div className="p-6">
				<Link
					className="text-muted-foreground text-xs hover:underline"
					to="/orders"
				>
					← 返回订单列表
				</Link>
				<p className="mt-4 text-muted-foreground text-sm">订单不存在</p>
			</div>
		);
	}

	const { review, ...order } = orderData;
	const profit = Number(order.pnl) >= 0;
	const report = generateMutation.data?.report ?? review?.aiReport ?? null;
	const isGenerating = generateMutation.isPending;
	const hasReport = Boolean(report);

	const handleGenerate = () => {
		generateMutation.mutate({ orderId, entryLogic, exitLogic });
	};

	const handleCopy = async () => {
		if (!report) {
			return;
		}
		try {
			await navigator.clipboard.writeText(report);
			toast.success("已复制到剪贴板");
		} catch {
			toast.error("复制失败，请手动选中复制");
		}
	};

	const handleExport = () => {
		if (!report) {
			return;
		}
		const filename = `order-review-${order.symbol}-${new Date(order.closedAt).toISOString().slice(0, 10)}.md`;
		downloadMarkdown(report, filename);
	};

	return (
		<div className="p-6">
			{/* Back link */}
			<Link
				className="text-muted-foreground text-xs hover:underline"
				to="/orders"
			>
				← 返回订单列表
			</Link>

			{/* Order header */}
			<div className="mt-4 mb-6">
				<div className="flex items-center gap-2">
					<h1 className="font-semibold text-lg">
						{formatSymbol(order.symbol)}{" "}
						<span className="font-normal text-muted-foreground">
							{order.side === "SELL" ? "做多" : "做空"}
						</span>
					</h1>
					{hasReport && <Badge variant="default">已复盘</Badge>}
				</div>
				<div
					className={
						profit
							? "mt-1 font-medium text-emerald-600 text-sm dark:text-emerald-400"
							: "mt-1 font-medium text-red-500 text-sm dark:text-red-400"
					}
				>
					{profit ? "盈利 " : "亏损 "}
					{formatPnl(order.pnl, order.pnlPercent)}
				</div>
				<div className="mt-1 text-muted-foreground text-xs">
					开仓：${Number(order.entryPrice).toFixed(2)} &nbsp;·&nbsp; 平仓：$
					{Number(order.exitPrice).toFixed(2)} &nbsp;·&nbsp; 数量：
					{Number(order.quantity).toFixed(4)}
				</div>
				<div className="mt-0.5 text-muted-foreground text-xs">
					开仓时间：{formatDateTime(order.openedAt)} &nbsp;·&nbsp; 平仓时间：
					{formatDateTime(order.closedAt)}
				</div>
			</div>

			{/* Logic inputs */}
			<div className="mb-6 space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="entry-logic">开仓逻辑</Label>
					<Textarea
						id="entry-logic"
						onChange={(e) => setEntryLogic(e.target.value)}
						placeholder="描述你为何开仓，例如：突破关键阻力位、均线金叉、成交量放大..."
						rows={3}
						value={entryLogic}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="exit-logic">平仓逻辑</Label>
					<Textarea
						id="exit-logic"
						onChange={(e) => setExitLogic(e.target.value)}
						placeholder="描述你为何平仓，例如：达到目标位、趋势反转信号、止损触发..."
						rows={3}
						value={exitLogic}
					/>
				</div>
			</div>

			{/* Action buttons */}
			<div className="mb-6 flex flex-wrap gap-2">
				<Button disabled={isGenerating} onClick={handleGenerate} size="sm">
					{generateBtnLabel(isGenerating, hasReport)}
				</Button>
				{hasReport && (
					<>
						<Button onClick={handleCopy} size="sm" variant="outline">
							复制
						</Button>
						<Button
							aria-label="导出为 Markdown"
							onClick={handleExport}
							size="sm"
							variant="outline"
						>
							导出 .md
						</Button>
					</>
				)}
			</div>

			{/* Report section */}
			{(isGenerating || hasReport) && (
				<ReportSection isGenerating={isGenerating} report={report} />
			)}
		</div>
	);
}

// ─── Report section ─────────────────────────────────────────────────────────────

function ReportSection({
	isGenerating,
	report,
}: {
	isGenerating: boolean;
	report: null | string;
}) {
	if (isGenerating) {
		return (
			<div>
				<p className="mb-3 text-muted-foreground text-xs">
					AI 正在分析你的交易...
				</p>
				<div className="space-y-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			</div>
		);
	}

	if (!report) {
		return null;
	}

	const sections = parseReportSections(report);

	if (sections.length === 0) {
		return (
			<Card>
				<CardContent className="px-4 py-3">
					<p className="whitespace-pre-wrap text-sm">{report}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div>
			<h2 className="mb-3 font-medium text-sm">AI 复盘报告</h2>
			<div className="space-y-3">
				{sections.map((section, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: sections are ordered report parts with no user-reorderable identity
					<Card key={i}>
						<CardContent className="px-4 py-3">
							<p className="mb-1.5 font-medium text-sm">{section.title}</p>
							<p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
								{section.content}
							</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
	return (
		<div className="p-6">
			<Skeleton className="h-4 w-20" />
			<div className="mt-4 space-y-2">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-64" />
				<Skeleton className="h-4 w-80" />
			</div>
			<div className="mt-6 space-y-4">
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-20 w-full" />
			</div>
			<Skeleton className="mt-4 h-8 w-32" />
		</div>
	);
}
