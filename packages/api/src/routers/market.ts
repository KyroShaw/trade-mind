import { db } from "@trade-mind/db";
import { newsItems, sectorCoins, sectors } from "@trade-mind/db/schema/market";
import { env } from "@trade-mind/env/server";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import z from "zod";

import { publicProcedure, router } from "../index";

// ─── Debounce guard ────────────────────────────────────────────────────────────
let lastRefreshAt = 0;
const REFRESH_DEBOUNCE_MS = 30 * 60 * 1000; // 30 min

// Top-level regex literals (lint/performance/useTopLevelRegex)
const JSON_OBJECT_RE = /\{[\s\S]*\}/;
const JSON_ARRAY_RE = /\[[\s\S]*\]/;

// ─── Claude API helper ─────────────────────────────────────────────────────────
async function callClaude(prompt: string): Promise<string> {
	const res = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"x-api-key": env.ANTHROPIC_API_KEY,
			"anthropic-version": "2023-06-01",
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 1024,
			messages: [{ role: "user", content: prompt }],
		}),
	});
	if (!res.ok) {
		throw new Error(`Claude API error: ${res.status}`);
	}
	const data = (await res.json()) as { content: [{ text: string }] };
	return data.content[0]?.text ?? "";
}

// ─── CoinGecko ─────────────────────────────────────────────────────────────────
interface CoinGeckoCategory {
	id: string;
	market_cap_change_24h: number | null;
	name: string;
}

interface CoinGeckoMarket {
	current_price: number;
	id: string;
	market_cap_rank: number;
	name: string;
	price_change_percentage_24h: number;
	symbol: string;
}

async function fetchTopCategories(): Promise<CoinGeckoCategory[]> {
	const headers: Record<string, string> = { accept: "application/json" };
	if (env.COINGECKO_API_KEY) {
		headers["x-cg-demo-api-key"] = env.COINGECKO_API_KEY;
	}
	const res = await fetch("https://api.coingecko.com/api/v3/coins/categories", {
		headers,
	});
	if (!res.ok) {
		throw new Error(`CoinGecko categories error: ${res.status}`);
	}
	const data = (await res.json()) as CoinGeckoCategory[];
	return data.slice(0, 15);
}

async function fetchCategoryCoins(
	categoryId: string
): Promise<CoinGeckoMarket[]> {
	const headers: Record<string, string> = { accept: "application/json" };
	if (env.COINGECKO_API_KEY) {
		headers["x-cg-demo-api-key"] = env.COINGECKO_API_KEY;
	}
	const url = `https://api.coingecko.com/api/v3/coins/markets?category=${categoryId}&order=market_cap_desc&per_page=5&page=1&vs_currency=usd`;
	const res = await fetch(url, { headers });
	if (!res.ok) {
		throw new Error(`CoinGecko markets error: ${res.status}`);
	}
	return (await res.json()) as CoinGeckoMarket[];
}

// ─── CryptoPanic ───────────────────────────────────────────────────────────────
interface CryptoPanicPost {
	id: number;
	kind: string;
	published_at: string;
	source: { title: string };
	title: string;
	url: string;
}

async function fetchCryptoPanicNews(): Promise<CryptoPanicPost[]> {
	const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${env.CRYPTOPANIC_API_KEY}&public=true&kind=news`;
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`CryptoPanic error: ${res.status}`);
	}
	const data = (await res.json()) as { results: CryptoPanicPost[] };
	return data.results ?? [];
}

// ─── AI heat scores ────────────────────────────────────────────────────────────
async function computeHeatScores(
	cats: { name: string; change: number }[]
): Promise<Record<string, number>> {
	const list = cats
		.map((c, i) => `${i + 1}. ${c.name} (24h: ${c.change.toFixed(2)}%)`)
		.join("\n");

	const prompt = `Rate the "heat" (market excitement/momentum) for each crypto sector from 0-100 based on its 24h price change.
Higher change (positive or negative) generally means higher heat.
Return ONLY a JSON object mapping the exact sector name to an integer score, like: {"DeFi": 82, "AI": 91}

Sectors:
${list}`;

	try {
		const text = await callClaude(prompt);
		const match = text.match(JSON_OBJECT_RE);
		if (!match) {
			return {};
		}
		return JSON.parse(match[0]) as Record<string, number>;
	} catch {
		return {};
	}
}

// ─── AI news summaries ─────────────────────────────────────────────────────────
async function computeNewsSummaries(titles: string[]): Promise<string[]> {
	if (titles.length === 0) {
		return [];
	}
	const numbered = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
	const prompt = `For each crypto news headline, write a one-sentence Chinese summary of its potential market impact.
Return ONLY a JSON array of strings in the same order, like: ["影响描述1", "影响描述2"]

Headlines:
${numbered}`;

	try {
		const text = await callClaude(prompt);
		const match = text.match(JSON_ARRAY_RE);
		if (!match) {
			return titles.map(() => "");
		}
		return JSON.parse(match[0]) as string[];
	} catch {
		return titles.map(() => "");
	}
}

// ─── Refresh helpers (extracted to reduce cognitive complexity) ─────────────────
async function refreshSectors(): Promise<void> {
	const categories = await fetchTopCategories();
	const heatInputs = categories.map((c) => ({
		name: c.name,
		change: c.market_cap_change_24h ?? 0,
	}));
	const heatScores = await computeHeatScores(heatInputs);

	for (const cat of categories) {
		const score = heatScores[cat.name] ?? 50;
		const change = cat.market_cap_change_24h ?? 0;
		const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

		const [sectorRow] = await db
			.insert(sectors)
			.values({
				name: cat.name,
				coinGeckoId: cat.id,
				heatScore: clampedScore,
				dailyChangePercent: String(change),
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: sectors.coinGeckoId,
				set: {
					heatScore: clampedScore,
					dailyChangePercent: String(change),
					updatedAt: new Date(),
				},
			})
			.returning({ id: sectors.id });

		if (!sectorRow) {
			continue;
		}
		await refreshSectorCoins(sectorRow.id, cat.id);
	}
}

async function refreshSectorCoins(
	sectorId: string,
	categoryId: string
): Promise<void> {
	try {
		const coins = await fetchCategoryCoins(categoryId);
		await db.delete(sectorCoins).where(eq(sectorCoins.sectorId, sectorId));
		for (const [idx, coin] of coins.entries()) {
			await db.insert(sectorCoins).values({
				sectorId,
				symbol: coin.symbol.toUpperCase(),
				name: coin.name,
				price: coin.current_price == null ? null : String(coin.current_price),
				change24hPercent:
					coin.price_change_percentage_24h == null
						? null
						: String(coin.price_change_percentage_24h),
				rank: idx + 1,
				updatedAt: new Date(),
			});
		}
	} catch {
		// Coin fetch failure doesn't block sector update
	}
}

async function refreshNews(): Promise<void> {
	const posts = await fetchCryptoPanicNews();
	const newPosts: CryptoPanicPost[] = [];

	for (const post of posts) {
		const existing = await db
			.select({ id: newsItems.id })
			.from(newsItems)
			.where(eq(newsItems.externalId, String(post.id)))
			.limit(1);
		if (existing.length === 0) {
			newPosts.push(post);
		}
	}

	if (newPosts.length > 0) {
		const summaries = await computeNewsSummaries(newPosts.map((p) => p.title));
		for (const [idx, post] of newPosts.entries()) {
			await db.insert(newsItems).values({
				externalId: String(post.id),
				title: post.title,
				url: post.url,
				source: post.source.title,
				tags: ["macro"],
				aiSummary: summaries[idx] ?? null,
				publishedAt: new Date(post.published_at),
			});
		}
	}

	// Clean up news older than 7 days
	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	await db
		.delete(newsItems)
		.where(sql`${newsItems.publishedAt} < ${sevenDaysAgo}`);
}

// ─── Main refresh logic ────────────────────────────────────────────────────────
export async function refreshMarketData(): Promise<void> {
	try {
		await refreshSectors();
	} catch {
		// Sector fetch failure — keep existing cached data
	}

	try {
		await refreshNews();
	} catch {
		// News fetch failure — keep existing cached data
	}
}

// ─── tRPC Router ───────────────────────────────────────────────────────────────
export const marketRouter = router({
	getSectors: publicProcedure.query(async () => {
		const sectorRows = await db
			.select()
			.from(sectors)
			.orderBy(desc(sectors.heatScore))
			.limit(15);

		if (sectorRows.length === 0) {
			return [];
		}

		const sectorIds = sectorRows.map((s) => s.id);
		const coinRows = await db
			.select()
			.from(sectorCoins)
			.where(inArray(sectorCoins.sectorId, sectorIds))
			.orderBy(asc(sectorCoins.rank));

		return sectorRows.map((sector) => ({
			...sector,
			coins: coinRows.filter((c) => c.sectorId === sector.id).slice(0, 3),
		}));
	}),

	getNews: publicProcedure
		.input(
			z.object({
				tags: z.array(z.string()).optional(),
				page: z.number().int().min(1).default(1),
			})
		)
		.query(({ input }) => {
			const PAGE_SIZE = 20;
			const offset = (input.page - 1) * PAGE_SIZE;

			const conditions = [
				gt(
					newsItems.publishedAt,
					new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
				),
			];

			if (input.tags && input.tags.length > 0) {
				conditions.push(sql`${newsItems.tags} && ${input.tags}::text[]`);
			}

			return db
				.select()
				.from(newsItems)
				.where(and(...conditions))
				.orderBy(desc(newsItems.publishedAt))
				.limit(PAGE_SIZE)
				.offset(offset);
		}),

	refreshSectors: publicProcedure.mutation(() => {
		const now = Date.now();
		if (now - lastRefreshAt < REFRESH_DEBOUNCE_MS) {
			return { queued: false, message: "刷新冷却中，请 30 分钟后再试" };
		}
		lastRefreshAt = now;
		refreshMarketData().catch((_err) => {
			/* non-blocking fire-and-forget */
		});
		return { queued: true, message: "刷新已触发" };
	}),
});
