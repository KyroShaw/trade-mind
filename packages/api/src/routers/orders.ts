import { createDecipheriv, createHmac } from "node:crypto";
import { db } from "@trade-mind/db";
import { apiKeys } from "@trade-mind/db/schema/auth";
import { orderReviews, orders } from "@trade-mind/db/schema/orders";
import { env } from "@trade-mind/env/server";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

// Common USDT spot pairs to sync — covers most actively traded symbols
const SYNC_SYMBOLS = [
	"BTCUSDT",
	"ETHUSDT",
	"BNBUSDT",
	"SOLUSDT",
	"ADAUSDT",
	"XRPUSDT",
	"DOGEUSDT",
	"DOTUSDT",
	"AVAXUSDT",
	"MATICUSDT",
	"LINKUSDT",
	"LTCUSDT",
	"UNIUSDT",
	"ATOMUSDT",
	"ETCUSDT",
	"NEARUSDT",
	"AAVEUSDT",
	"APTUSDT",
	"SUIUSDT",
	"TRUMPUSDT",
];

// ─── Crypto helpers ────────────────────────────────────────────────────────────

function getEncryptionKey(): Buffer {
	if (!env.ENCRYPTION_KEY) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "服务器未配置加密密钥，请联系管理员设置 ENCRYPTION_KEY",
		});
	}
	return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

function decrypt(cipherText: string): string {
	const parts = cipherText.split(":");
	if (parts.length !== 3) {
		throw new Error("Invalid cipher text format");
	}
	const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];
	const key = getEncryptionKey();
	const iv = Buffer.from(ivHex, "hex");
	const authTag = Buffer.from(authTagHex, "hex");
	const encrypted = Buffer.from(encryptedHex, "hex");
	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);
	return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}

// ─── Binance types + fetcher ───────────────────────────────────────────────────

interface BinanceTrade {
	id: number;
	isBuyer: boolean;
	orderId: number;
	price: string;
	qty: string;
	time: number;
}

async function fetchBinanceTrades(
	apiKey: string,
	secretKey: string,
	symbol: string,
	startTime: number
): Promise<BinanceTrade[]> {
	const timestamp = Date.now();
	const queryString = `symbol=${symbol}&startTime=${startTime}&limit=1000&timestamp=${timestamp}`;
	const signature = createHmac("sha256", secretKey)
		.update(queryString)
		.digest("hex");
	const url = `https://api.binance.com/api/v3/myTrades?${queryString}&signature=${signature}`;

	let res: Response;
	try {
		res = await fetch(url, { headers: { "X-MBX-APIKEY": apiKey } });
	} catch {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "无法连接 Binance API，请检查网络",
		});
	}

	if (res.status === 429 || res.status === 418) {
		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: "Binance API 触发速率限制，请稍后重试",
		});
	}

	if (!res.ok) {
		const data = (await res.json()) as { code?: number; msg?: string };
		if (data.code === -1121) {
			return []; // invalid symbol — skip
		}
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: data.msg ?? "Binance API 请求失败",
		});
	}

	return (await res.json()) as BinanceTrade[];
}

// ─── Sync helpers (extracted to stay under complexity limit) ───────────────────

async function upsertSellTrade(
	userId: string,
	symbol: string,
	trade: BinanceTrade,
	buysByTime: BinanceTrade[]
): Promise<void> {
	const matchingBuy = [...buysByTime]
		.filter((b) => b.time <= trade.time)
		.at(-1);
	const entryPrice = matchingBuy
		? Number(matchingBuy.price)
		: Number(trade.price);
	const exitPrice = Number(trade.price);
	const quantity = Number(trade.qty);
	const pnl = (exitPrice - entryPrice) * quantity;
	const pnlPercent =
		entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 : 0;

	await db
		.insert(orders)
		.values({
			userId,
			binanceOrderId: String(trade.id),
			symbol,
			side: "SELL",
			entryPrice: String(entryPrice),
			exitPrice: String(exitPrice),
			quantity: String(quantity),
			pnl: String(pnl),
			pnlPercent: String(pnlPercent),
			openedAt: matchingBuy ? new Date(matchingBuy.time) : new Date(trade.time),
			closedAt: new Date(trade.time),
			syncedAt: new Date(),
		})
		.onConflictDoNothing({ target: [orders.binanceOrderId, orders.userId] });
}

async function syncSymbolTrades(
	userId: string,
	symbol: string,
	apiKeyPlain: string,
	secretKeyPlain: string,
	startTime: number
): Promise<number> {
	const trades = await fetchBinanceTrades(
		apiKeyPlain,
		secretKeyPlain,
		symbol,
		startTime
	);
	if (trades.length === 0) {
		return 0;
	}

	const buysByTime = trades
		.filter((t) => t.isBuyer)
		.sort((a, b) => a.time - b.time);
	const sellTrades = trades
		.filter((t) => !t.isBuyer)
		.sort((a, b) => a.time - b.time);

	for (const trade of sellTrades) {
		await upsertSellTrade(userId, symbol, trade, buysByTime);
	}
	return sellTrades.length;
}

// ─── AI review helper ─────────────────────────────────────────────────────────

function buildReviewPrompt(
	order: {
		closedAt: Date;
		entryPrice: string;
		exitPrice: string;
		openedAt: Date;
		pnl: string;
		pnlPercent: string;
		quantity: string;
		symbol: string;
	},
	entryLogic: string | undefined,
	exitLogic: string | undefined
): string {
	const sign = Number(order.pnl) >= 0 ? "+" : "";
	const duration = Math.round(
		(order.closedAt.getTime() - order.openedAt.getTime()) / 60_000
	);
	const lines = [
		"你是一位专业的加密货币现货交易分析师，请对以下已平仓交易做三维度复盘。",
		"",
		"## 交易数据",
		`- 交易对：${order.symbol}`,
		`- 入场价：${order.entryPrice} USDT`,
		`- 出场价：${order.exitPrice} USDT`,
		`- 数量：${order.quantity}`,
		`- 盈亏：${sign}${Number(order.pnl).toFixed(4)} USDT（${sign}${Number(order.pnlPercent).toFixed(2)}%）`,
		`- 持仓时长：${duration} 分钟`,
	];
	if (entryLogic) {
		lines.push("", "## 开仓逻辑（用户填写）", entryLogic);
	}
	if (exitLogic) {
		lines.push("", "## 平仓逻辑（用户填写）", exitLogic);
	}
	lines.push(
		"",
		"请严格按照以下 Markdown 格式输出，不要添加多余标题：",
		"",
		"## ✅ 执行质量",
		"（2-3 句评价入场和出场时机、价格执行质量）",
		"",
		"## ⚠️ 风险控制",
		"（2-3 句评价仓位大小、持仓时间和潜在风险敞口）",
		"",
		"## 💡 改进建议",
		"（2-3 条具体可执行的改进建议）"
	);
	return lines.join("\n");
}

async function generateAIReport(
	order: {
		closedAt: Date;
		entryPrice: string;
		exitPrice: string;
		openedAt: Date;
		pnl: string;
		pnlPercent: string;
		quantity: string;
		symbol: string;
	},
	entryLogic: string | undefined,
	exitLogic: string | undefined
): Promise<string> {
	if (!env.ANTHROPIC_API_KEY) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "AI 功能未启用，请联系管理员配置 ANTHROPIC_API_KEY",
		});
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
				max_tokens: 1500,
				messages: [
					{
						content: buildReviewPrompt(order, entryLogic, exitLogic),
						role: "user",
					},
				],
				model: "claude-haiku-4-5-20251001",
			}),
		});
		if (!res.ok) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "AI 服务暂时不可用，请稍后重试",
			});
		}
		const data = (await res.json()) as { content: [{ text: string }] };
		return data.content[0]?.text ?? "";
	} catch (err) {
		if (err instanceof TRPCError) {
			throw err;
		}
		if (err instanceof Error && err.name === "AbortError") {
			throw new TRPCError({
				code: "TIMEOUT",
				message: "AI 分析超时（>30s），请稍后重试",
			});
		}
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "AI 复盘生成失败，请稍后重试",
		});
	} finally {
		clearTimeout(timer);
	}
}

// ─── tRPC Router ───────────────────────────────────────────────────────────────

export const ordersRouter = router({
	sync: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const [keyRecord] = await db
			.select({
				encryptedKey: apiKeys.encryptedKey,
				encryptedSecret: apiKeys.encryptedSecret,
				isValid: apiKeys.isValid,
			})
			.from(apiKeys)
			.where(eq(apiKeys.userId, userId))
			.limit(1);

		if (!keyRecord?.isValid) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "请先绑定 Binance API Key",
			});
		}

		let apiKeyPlain: string;
		let secretKeyPlain: string;
		try {
			apiKeyPlain = decrypt(keyRecord.encryptedKey);
			secretKeyPlain = decrypt(keyRecord.encryptedSecret);
		} catch {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "API Key 解密失败，请重新绑定",
			});
		}

		const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
		const [lastSynced] = await db
			.select({ syncedAt: orders.syncedAt })
			.from(orders)
			.where(eq(orders.userId, userId))
			.orderBy(desc(orders.syncedAt))
			.limit(1);
		const startTime = lastSynced
			? Math.max(lastSynced.syncedAt.getTime() - 60_000, ninetyDaysAgo)
			: ninetyDaysAgo;

		let totalInserted = 0;

		for (let i = 0; i < SYNC_SYMBOLS.length; i++) {
			const symbol = SYNC_SYMBOLS[i] as string;
			try {
				const count = await syncSymbolTrades(
					userId,
					symbol,
					apiKeyPlain,
					secretKeyPlain,
					startTime
				);
				totalInserted += count;
			} catch (err) {
				if (err instanceof TRPCError && err.code === "TOO_MANY_REQUESTS") {
					throw err;
				}
				// Skip symbols with errors (invalid symbol, no trading history, etc.)
			}

			// Respect Binance rate limit: 10 weight per myTrades call, 1200/min ceiling
			if (i < SYNC_SYMBOLS.length - 1) {
				await new Promise<void>((resolve) => setTimeout(resolve, 250));
			}
		}

		return { count: totalInserted };
	}),

	list: protectedProcedure
		.input(
			z.object({
				symbol: z.string().optional(),
				side: z.enum(["BUY", "SELL"]).optional(),
				dateFrom: z.string().datetime().optional(),
				dateTo: z.string().datetime().optional(),
				page: z.number().int().min(1).default(1),
				pageSize: z.number().int().min(1).max(100).default(20),
			})
		)
		.query(({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const offset = (input.page - 1) * input.pageSize;

			const conditions = [eq(orders.userId, userId)];
			if (input.symbol) {
				conditions.push(eq(orders.symbol, input.symbol));
			}
			if (input.side) {
				conditions.push(eq(orders.side, input.side));
			}
			if (input.dateFrom) {
				conditions.push(gte(orders.closedAt, new Date(input.dateFrom)));
			}
			if (input.dateTo) {
				conditions.push(lte(orders.closedAt, new Date(input.dateTo)));
			}

			return db
				.select({
					id: orders.id,
					symbol: orders.symbol,
					side: orders.side,
					entryPrice: orders.entryPrice,
					exitPrice: orders.exitPrice,
					quantity: orders.quantity,
					pnl: orders.pnl,
					pnlPercent: orders.pnlPercent,
					openedAt: orders.openedAt,
					closedAt: orders.closedAt,
					hasReview: sql<boolean>`(
						SELECT COUNT(*) > 0
						FROM order_reviews
						WHERE order_id = ${orders.id}
						  AND ai_report IS NOT NULL
					)`,
				})
				.from(orders)
				.where(and(...conditions))
				.orderBy(desc(orders.closedAt))
				.limit(input.pageSize)
				.offset(offset);
		}),

	get: protectedProcedure
		.input(z.object({ orderId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const [order] = await db
				.select()
				.from(orders)
				.where(
					and(
						eq(orders.id, input.orderId),
						eq(orders.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!order) {
				throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
			}

			const [review] = await db
				.select()
				.from(orderReviews)
				.where(eq(orderReviews.orderId, input.orderId))
				.limit(1);

			return { ...order, review: review ?? null };
		}),

	generateReview: protectedProcedure
		.input(
			z.object({
				orderId: z.string().min(1),
				entryLogic: z.string().optional(),
				exitLogic: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [order] = await db
				.select()
				.from(orders)
				.where(
					and(
						eq(orders.id, input.orderId),
						eq(orders.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!order) {
				throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
			}

			const report = await generateAIReport(
				order,
				input.entryLogic,
				input.exitLogic
			);

			await db
				.insert(orderReviews)
				.values({
					orderId: input.orderId,
					entryLogic: input.entryLogic ?? null,
					exitLogic: input.exitLogic ?? null,
					aiReport: report,
					generatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: orderReviews.orderId,
					set: {
						entryLogic: input.entryLogic ?? null,
						exitLogic: input.exitLogic ?? null,
						aiReport: report,
						generatedAt: new Date(),
					},
				});

			return { report };
		}),

	exportReview: protectedProcedure
		.input(z.object({ orderId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const [order] = await db
				.select({ id: orders.id })
				.from(orders)
				.where(
					and(
						eq(orders.id, input.orderId),
						eq(orders.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!order) {
				throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
			}

			const [review] = await db
				.select({ aiReport: orderReviews.aiReport })
				.from(orderReviews)
				.where(eq(orderReviews.orderId, input.orderId))
				.limit(1);

			if (!review?.aiReport) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "暂无复盘报告，请先生成",
				});
			}

			return review.aiReport;
		}),
});
