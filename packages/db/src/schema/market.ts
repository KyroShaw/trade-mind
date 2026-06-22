import { relations } from "drizzle-orm";
import { index, integer, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const sectors = pgTable(
	"sectors",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: text("name").notNull(),
		coinGeckoId: text("coingecko_id").notNull().unique(),
		heatScore: integer("heat_score").default(0).notNull(),
		dailyChangePercent: numeric("daily_change_percent", { precision: 10, scale: 4 }),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [index("sectors_updated_at_idx").on(table.updatedAt)],
);

export const sectorCoins = pgTable(
	"sector_coins",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		sectorId: text("sector_id")
			.notNull()
			.references(() => sectors.id, { onDelete: "cascade" }),
		symbol: text("symbol").notNull(),
		name: text("name").notNull(),
		price: numeric("price", { precision: 20, scale: 8 }),
		change24hPercent: numeric("change_24h_percent", { precision: 10, scale: 4 }),
		rank: integer("rank").notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		index("sector_coins_sector_id_idx").on(table.sectorId),
		uniqueIndex("sector_coins_sector_symbol_idx").on(table.sectorId, table.symbol),
	],
);

export const newsItems = pgTable(
	"news_items",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		externalId: text("external_id").notNull().unique(),
		title: text("title").notNull(),
		url: text("url").notNull(),
		source: text("source").notNull(),
		tags: text("tags").array().notNull(),
		aiSummary: text("ai_summary"),
		publishedAt: timestamp("published_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("news_items_published_at_idx").on(table.publishedAt),
		index("news_items_external_id_idx").on(table.externalId),
	],
);

export const sectorRelations = relations(sectors, ({ many }) => ({
	coins: many(sectorCoins),
}));

export const sectorCoinRelations = relations(sectorCoins, ({ one }) => ({
	sector: one(sectors, {
		fields: [sectorCoins.sectorId],
		references: [sectors.id],
	}),
}));
