import { publicProcedure, router } from "../index";
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
});
export type AppRouter = typeof appRouter;
