import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@trade-mind/api/context";
import { appRouter } from "@trade-mind/api/routers/index";
import { refreshMarketData } from "@trade-mind/api/routers/market";
import { auth } from "@trade-mind/auth";
import { env } from "@trade-mind/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => createContext({ context }),
	})
);

app.get("/", (c) => c.text("OK"));

import { serve } from "@hono/node-server";

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);

// Seed market data on startup and refresh every 30 min
refreshMarketData().catch((_err) => {
	/* non-blocking */
});
setInterval(
	() => {
		refreshMarketData().catch((_err) => {
			/* non-blocking */
		});
	},
	30 * 60 * 1000
);
