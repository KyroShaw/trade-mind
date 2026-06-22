import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const alphaProjects = pgTable(
	"alpha_projects",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		binanceId: text("binance_id").notNull().unique(),
		name: text("name").notNull(),
		symbol: text("symbol").notNull(),
		price: numeric("price", { precision: 20, scale: 8 }),
		change7dPercent: numeric("change_7d_percent", { precision: 10, scale: 4 }),
		change30dPercent: numeric("change_30d_percent", {
			precision: 10,
			scale: 4,
		}),
		volatility7d: numeric("volatility_7d", { precision: 10, scale: 4 }),
		isBottomConsolidation: boolean("is_bottom_consolidation")
			.default(false)
			.notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		index("alpha_projects_symbol_idx").on(table.symbol),
		index("alpha_projects_updated_at_idx").on(table.updatedAt),
		index("alpha_projects_is_bottom_consolidation_idx").on(
			table.isBottomConsolidation
		),
	]
);

export const userWatchlist = pgTable(
	"user_watchlist",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		projectId: text("project_id")
			.notNull()
			.references(() => alphaProjects.id, { onDelete: "cascade" }),
		addedAt: timestamp("added_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("user_watchlist_user_project_idx").on(
			table.userId,
			table.projectId
		),
		index("user_watchlist_user_id_idx").on(table.userId),
	]
);

export const alphaProjectsRelations = relations(alphaProjects, ({ many }) => ({
	watchlistEntries: many(userWatchlist),
}));

export const userWatchlistRelations = relations(userWatchlist, ({ one }) => ({
	user: one(user, {
		fields: [userWatchlist.userId],
		references: [user.id],
	}),
	project: one(alphaProjects, {
		fields: [userWatchlist.projectId],
		references: [alphaProjects.id],
	}),
}));
