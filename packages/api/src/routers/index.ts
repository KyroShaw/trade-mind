import { publicProcedure, router } from "../index";
import { alphaRouter } from "./alpha";
import { analysisRouter } from "./analysis";
import { apiKeyRouter } from "./apiKey";
import { marketRouter } from "./market";
import { ordersRouter } from "./orders";
import { todoRouter } from "./todo";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	todo: todoRouter,
	apiKey: apiKeyRouter,
	market: marketRouter,
	orders: ordersRouter,
	alpha: alphaRouter,
	analysis: analysisRouter,
});
export type AppRouter = typeof appRouter;
