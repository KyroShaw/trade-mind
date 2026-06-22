CREATE TABLE "alpha_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"binance_id" text NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"price" numeric(20, 8),
	"change_7d_percent" numeric(10, 4),
	"change_30d_percent" numeric(10, 4),
	"volatility_7d" numeric(10, 4),
	"is_bottom_consolidation" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alpha_projects_binance_id_unique" UNIQUE("binance_id")
);
--> statement-breakpoint
CREATE TABLE "user_watchlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_watchlist" ADD CONSTRAINT "user_watchlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watchlist" ADD CONSTRAINT "user_watchlist_project_id_alpha_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."alpha_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alpha_projects_symbol_idx" ON "alpha_projects" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "alpha_projects_updated_at_idx" ON "alpha_projects" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "alpha_projects_is_bottom_consolidation_idx" ON "alpha_projects" USING btree ("is_bottom_consolidation");--> statement-breakpoint
CREATE UNIQUE INDEX "user_watchlist_user_project_idx" ON "user_watchlist" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "user_watchlist_user_id_idx" ON "user_watchlist" USING btree ("user_id");