import { db } from "@trade-mind/db";
import { alertSettings } from "@trade-mind/db/schema/analysis";
import { orders } from "@trade-mind/db/schema/orders";
import { env } from "@trade-mind/env/server";
import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CurvePoint {
	cumulativePnl: number;
	dailyPnl: number;
	date: string;
}

interface AlertResult {
	aiAnalysis: string | null;
	streakCount: number;
	triggered: boolean;
	type: "loss" | "win" | null;
}

// ─── In-memory AI analysis cache (TTL = 1 hour) ────────────────────────────────

interface CacheEntry {
	expiry: number;
	result: string;
}

const aiAnalysisCache = new Map<string, CacheEntry>();

function getCachedAnalysis(userId: string): string | null {
	const entry = aiAnalysisCache.get(userId);
	if (!entry) {
		return null;
	}
	if (Date.now() > entry.expiry) {
		aiAnalysisCache.delete(userId);
		return null;
	}
	return entry.result;
}

function setCachedAnalysis(userId: string, result: string): void {
	aiAnalysisCache.set(userId, {
		result,
		expiry: Date.now() + 60 * 60 * 1000,
	});
}

// ─── Curve calculation helpers ─────────────────────────────────────────────────

function formatBucket(date: Date, granularity: "day" | "week"): string {
	if (granularity === "week") {
		const d = new Date(date);
		const day = d.getUTCDay();
		const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
		d.setUTCDate(diff);
		return d.toISOString().slice(0, 10);
	}
	return date.toISOString().slice(0, 10);
}

// ─── AI analysis helper ────────────────────────────────────────────────────────

interface OrderSummary {
	durationMinutes: number;
	pnl: number;
	symbol: string;
}

function buildAlertPrompt(
	recentOrders: OrderSummary[],
	streakType: "loss" | "win",
	streakCount: number
): string {
	const direction = streakType === "loss" ? "连续亏损" : "连续盈利";
	const lines = [
		"你是一位专业的加密货币交易分析师。请分析以下交易数据并给出简短建议。",
		"",
		`## 当前状态：${direction} ${streakCount} 笔`,
		"",
		"## 近期交易（最新在前）",
	];
	for (const o of recentOrders) {
		const sign = o.pnl >= 0 ? "+" : "";
		lines.push(
			`- ${o.symbol}：PnL ${sign}${o.pnl.toFixed(4)} USDT，持仓 ${o.durationMinutes} 分钟`
		);
	}
	lines.push(
		"",
		"请用中文输出不超过 200 字的分析：识别交易模式、潜在风险，并给出 1-2 条具体建议。不要使用 Markdown 标题。"
	);
	return lines.join("\n");
}

async function generateAlertAnalysis(
	userId: string,
	recentOrders: OrderSummary[],
	streakType: "loss" | "win",
	streakCount: number
): Promise<string> {
	const cached = getCachedAnalysis(userId);
	if (cached !== null) {
		return cached;
	}

	if (!env.ANTHROPIC_API_KEY) {
		return "AI 功能未启用，请联系管理员配置 ANTHROPIC_API_KEY。";
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 30_000);
	try {
		const res = await fetch("https://api.anthropic.com/v1/messages", {
			signal: controller.signal,
			method: "POST",
			headers: {
				"anthropic-version": "2023-06-01",
				"content-type": "application/json",
				"x-api-key": env.ANTHROPIC_API_KEY,
			},
			body: JSON.stringify({
				max_tokens: 300,
				messages: [
					{
						content: buildAlertPrompt(recentOrders, streakType, streakCount),
						role: "user",
					},
				],
				model: "claude-haiku-4-5-20251001",
			}),
		});

		if (!res.ok) {
			return "AI 服务暂时不可用，请稍后重试。";
		}

		const data = (await res.json()) as { content: [{ text: string }] };
		const text = data.content[0]?.text ?? "";
		setCachedAnalysis(userId, text);
		return text;
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			return "AI 分析超时，请稍后重试。";
		}
		return "AI 分析生成失败，请稍后重试。";
	} finally {
		clearTimeout(timer);
	}
}

// ─── tRPC Router ───────────────────────────────────────────────────────────────

export const analysisRouter = router({
	getCurve: protectedProcedure
		.input(
			z.object({
				granularity: z.enum(["day", "week"]),
			})
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const rows = await db
				.select({
					pnl: orders.pnl,
					closedAt: orders.closedAt,
				})
				.from(orders)
				.where(eq(orders.userId, userId))
				.orderBy(desc(orders.closedAt));

			const bucketMap = new Map<string, number>();

			for (const row of rows) {
				const bucket = formatBucket(row.closedAt, input.granularity);
				const current = bucketMap.get(bucket) ?? 0;
				bucketMap.set(bucket, current + Number(row.pnl));
			}

			const sortedBuckets = Array.from(bucketMap.entries()).sort(([a], [b]) =>
				a.localeCompare(b)
			);

			const result: CurvePoint[] = [];
			let cumulative = 0;
			for (const [date, dailyPnl] of sortedBuckets) {
				cumulative += dailyPnl;
				result.push({ date, dailyPnl, cumulativePnl: cumulative });
			}

			return result;
		}),

	getSummary: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [summary] = await db
			.select({
				totalPnl: sql<string>`COALESCE(SUM(${orders.pnl}), 0)`,
				totalCount: sql<number>`COUNT(*)`,
				winCount: sql<number>`SUM(CASE WHEN ${orders.pnl} > 0 THEN 1 ELSE 0 END)`,
				avgPnlRatio: sql<string>`COALESCE(AVG(${orders.pnlPercent}), 0)`,
			})
			.from(orders)
			.where(eq(orders.userId, userId));

		const totalPnl = Number(summary?.totalPnl ?? 0);
		const totalCount = Number(summary?.totalCount ?? 0);
		const winCount = Number(summary?.winCount ?? 0);
		const winRate = totalCount > 0 ? winCount / totalCount : 0;
		const avgPnlRatio = Number(summary?.avgPnlRatio ?? 0);

		return { totalPnl, winRate, avgPnlRatio };
	}),

	getAlert: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [settings] = await db
			.select({
				lossStreakThreshold: alertSettings.lossStreakThreshold,
				winStreakThreshold: alertSettings.winStreakThreshold,
			})
			.from(alertSettings)
			.where(eq(alertSettings.userId, userId))
			.limit(1);

		const lossThreshold = settings?.lossStreakThreshold ?? 3;
		const winThreshold = settings?.winStreakThreshold ?? 5;
		const lookback = Math.max(lossThreshold, winThreshold);

		const recentOrders = await db
			.select({
				pnl: orders.pnl,
				symbol: orders.symbol,
				closedAt: orders.closedAt,
				openedAt: orders.openedAt,
			})
			.from(orders)
			.where(eq(orders.userId, userId))
			.orderBy(desc(orders.closedAt))
			.limit(lookback);

		if (recentOrders.length === 0) {
			const result: AlertResult = {
				triggered: false,
				type: null,
				streakCount: 0,
				aiAnalysis: null,
			};
			return result;
		}

		let lossStreak = 0;
		for (const o of recentOrders) {
			if (Number(o.pnl) < 0) {
				lossStreak++;
			} else {
				break;
			}
		}

		let winStreak = 0;
		for (const o of recentOrders) {
			if (Number(o.pnl) > 0) {
				winStreak++;
			} else {
				break;
			}
		}

		const lossTriggered = lossStreak >= lossThreshold;
		const winTriggered = winStreak >= winThreshold;

		if (!(lossTriggered || winTriggered)) {
			const result: AlertResult = {
				triggered: false,
				type: null,
				streakCount: Math.max(lossStreak, winStreak),
				aiAnalysis: null,
			};
			return result;
		}

		const streakType: "loss" | "win" = lossTriggered ? "loss" : "win";
		const streakCount = lossTriggered ? lossStreak : winStreak;

		const analysisOrders = await db
			.select({
				pnl: orders.pnl,
				symbol: orders.symbol,
				closedAt: orders.closedAt,
				openedAt: orders.openedAt,
			})
			.from(orders)
			.where(eq(orders.userId, userId))
			.orderBy(desc(orders.closedAt))
			.limit(10);

		const orderSummaries: OrderSummary[] = analysisOrders.map((o) => ({
			symbol: o.symbol,
			pnl: Number(o.pnl),
			durationMinutes: Math.round(
				(o.closedAt.getTime() - o.openedAt.getTime()) / 60_000
			),
		}));

		const aiAnalysis = await generateAlertAnalysis(
			userId,
			orderSummaries,
			streakType,
			streakCount
		);

		const result: AlertResult = {
			triggered: true,
			type: streakType,
			streakCount,
			aiAnalysis,
		};
		return result;
	}),

	updateAlertSettings: protectedProcedure
		.input(
			z.object({
				lossThreshold: z.number().int(),
				winThreshold: z.number().int(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { lossThreshold, winThreshold } = input;

			if (lossThreshold < 2 || lossThreshold > 10) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "lossThreshold 必须在 2-10 范围内",
				});
			}
			if (winThreshold < 2 || winThreshold > 10) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "winThreshold 必须在 2-10 范围内",
				});
			}

			const userId = ctx.session.user.id;

			await db
				.insert(alertSettings)
				.values({
					userId,
					lossStreakThreshold: lossThreshold,
					winStreakThreshold: winThreshold,
				})
				.onConflictDoUpdate({
					target: alertSettings.userId,
					set: {
						lossStreakThreshold: lossThreshold,
						winStreakThreshold: winThreshold,
						updatedAt: new Date(),
					},
				});
		}),
});
