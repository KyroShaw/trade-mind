import { publicProcedure, router } from "../index";
import { apiKeyRouter } from "./apiKey";
import { todoRouter } from "./todo";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	todo: todoRouter,
	apiKey: apiKeyRouter,
});
export type AppRouter = typeof appRouter;
