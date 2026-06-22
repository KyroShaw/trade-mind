import { relations } from "drizzle-orm";
import {
	index,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const orderSideEnum = pgEnum("order_side", ["BUY", "SELL"]);

export const orders = pgTable(
	"orders",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		binanceOrderId: text("binance_order_id").notNull(),
		symbol: text("symbol").notNull(),
		side: orderSideEnum("side").notNull(),
		entryPrice: numeric("entry_price", { precision: 20, scale: 8 }).notNull(),
		exitPrice: numeric("exit_price", { precision: 20, scale: 8 }).notNull(),
		quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
		pnl: numeric("pnl", { precision: 20, scale: 8 }).notNull(),
		pnlPercent: numeric("pnl_percent", { precision: 10, scale: 4 }).notNull(),
		openedAt: timestamp("opened_at").notNull(),
		closedAt: timestamp("closed_at").notNull(),
		syncedAt: timestamp("synced_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("orders_binance_order_id_user_idx").on(
			table.binanceOrderId,
			table.userId
		),
		index("orders_user_id_idx").on(table.userId),
		index("orders_symbol_idx").on(table.symbol),
		index("orders_closed_at_idx").on(table.closedAt),
	]
);

export const orderReviews = pgTable(
	"order_reviews",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		orderId: text("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		entryLogic: text("entry_logic"),
		exitLogic: text("exit_logic"),
		aiReport: text("ai_report"),
		generatedAt: timestamp("generated_at"),
	},
	(table) => [uniqueIndex("order_reviews_order_id_idx").on(table.orderId)]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
	user: one(user, {
		fields: [orders.userId],
		references: [user.id],
	}),
	reviews: many(orderReviews),
}));

export const orderReviewsRelations = relations(orderReviews, ({ one }) => ({
	order: one(orders, {
		fields: [orderReviews.orderId],
		references: [orders.id],
	}),
}));
