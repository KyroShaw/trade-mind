import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const alertSettings = pgTable(
	"alert_settings",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		lossStreakThreshold: integer("loss_streak_threshold").default(3).notNull(),
		winStreakThreshold: integer("win_streak_threshold").default(5).notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [uniqueIndex("alert_settings_user_id_idx").on(table.userId)]
);

export const alertSettingsRelations = relations(alertSettings, ({ one }) => ({
	user: one(user, {
		fields: [alertSettings.userId],
		references: [user.id],
	}),
}));
