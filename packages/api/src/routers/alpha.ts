import { db } from "@trade-mind/db";
import { alphaProjects, userWatchlist } from "@trade-mind/db/schema/alpha";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// ─── Binance Alpha data types ──────────────────────────────────────────────────

interface BinanceAlphaProject {
	high: string;
	low: string;
	price: string;
	priceChangePercent: string;
	priceChangePercent30d: string;
	projectCode: string;
	projectName: string;
	symbol: string;
}

interface BinanceAlphaResponse {
	code: string;
	data: {
		list: BinanceAlphaProject[];
	};
}

// ─── Binance Alpha fetcher ─────────────────────────────────────────────────────

async function fetchBinanceAlphaProjects(): Promise<BinanceAlphaProject[]> {
	const res = await fetch(
		"https://www.binance.com/bapi/composite/v1/public/alpha/project/list",
		{
			headers: {
				accept: "application/json",
				"user-agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
			},
		}
	);

	if (!res.ok) {
		throw new Error(`Binance Alpha API error: ${res.status}`);
	}

	const data = (await res.json()) as BinanceAlphaResponse;
	if (data.code !== "000000" || !Array.isArray(data.data?.list)) {
		throw new Error("Binance Alpha API returned unexpected shape");
	}

	return data.data.list;
}

// ─── Volatility + consolidation calculation ────────────────────────────────────

function computeVolatility7d(high: string, low: string): number {
	const h = Number(high);
	const l = Number(low);
	if (l <= 0) {
		return 0;
	}
	return ((h - l) / l) * 100;
}

function computeIsBottomConsolidation(
	change30dPercent: number,
	volatility7d: number
): boolean {
	return change30dPercent < -30 && volatility7d < 10;
}

// ─── Refresh helper ────────────────────────────────────────────────────────────

export async function refreshAlphaData(): Promise<void> {
	let projects: BinanceAlphaProject[];
	try {
		projects = await fetchBinanceAlphaProjects();
	} catch {
		return;
	}

	for (const p of projects) {
		const change30d = Number(p.priceChangePercent30d);
		const volatility7d = computeVolatility7d(p.high, p.low);
		const isBottomConsolidation = computeIsBottomConsolidation(
			change30d,
			volatility7d
		);

		await db
			.insert(alphaProjects)
			.values({
				id: crypto.randomUUID(),
				binanceId: p.projectCode,
				name: p.projectName,
				symbol: p.symbol.toUpperCase(),
				price: p.price || null,
				change7dPercent: p.priceChangePercent || null,
				change30dPercent: p.priceChangePercent30d || null,
				volatility7d: String(volatility7d),
				isBottomConsolidation,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: alphaProjects.binanceId,
				set: {
					name: p.projectName,
					symbol: p.symbol.toUpperCase(),
					price: p.price || null,
					change7dPercent: p.priceChangePercent || null,
					change30dPercent: p.priceChangePercent30d || null,
					volatility7d: String(volatility7d),
					isBottomConsolidation,
					updatedAt: new Date(),
				},
			});
	}
}

// ─── tRPC Router ───────────────────────────────────────────────────────────────

export const alphaRouter = router({
	list: publicProcedure
		.input(
			z.object({
				filter: z.enum(["all", "bottom"]).optional().default("all"),
			})
		)
		.query(({ input }) => {
			if (input.filter === "bottom") {
				return db
					.select()
					.from(alphaProjects)
					.where(eq(alphaProjects.isBottomConsolidation, true))
					.orderBy(desc(alphaProjects.updatedAt));
			}
			return db
				.select()
				.from(alphaProjects)
				.orderBy(
					desc(alphaProjects.isBottomConsolidation),
					desc(alphaProjects.updatedAt)
				);
		}),

	getWatchlist: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const rows = await db
			.select({
				id: alphaProjects.id,
				binanceId: alphaProjects.binanceId,
				name: alphaProjects.name,
				symbol: alphaProjects.symbol,
				price: alphaProjects.price,
				change7dPercent: alphaProjects.change7dPercent,
				change30dPercent: alphaProjects.change30dPercent,
				volatility7d: alphaProjects.volatility7d,
				isBottomConsolidation: alphaProjects.isBottomConsolidation,
				updatedAt: alphaProjects.updatedAt,
				addedAt: userWatchlist.addedAt,
			})
			.from(userWatchlist)
			.innerJoin(alphaProjects, eq(userWatchlist.projectId, alphaProjects.id))
			.where(eq(userWatchlist.userId, userId))
			.orderBy(desc(userWatchlist.addedAt));

		return rows;
	}),

	addToWatchlist: protectedProcedure
		.input(z.object({ projectId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [project] = await db
				.select({ id: alphaProjects.id })
				.from(alphaProjects)
				.where(eq(alphaProjects.id, input.projectId))
				.limit(1);

			if (!project) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "项目不存在",
				});
			}

			await db
				.insert(userWatchlist)
				.values({
					id: crypto.randomUUID(),
					userId,
					projectId: input.projectId,
					addedAt: new Date(),
				})
				.onConflictDoNothing({
					target: [userWatchlist.userId, userWatchlist.projectId],
				});
		}),

	removeFromWatchlist: protectedProcedure
		.input(z.object({ projectId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			await db
				.delete(userWatchlist)
				.where(
					and(
						eq(userWatchlist.userId, userId),
						eq(userWatchlist.projectId, input.projectId)
					)
				);
		}),
});
