import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import userRouter from "./routes/users/route";
import contractRouter from "./routes/contracts/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  users: userRouter,
  contracts: contractRouter,
});

export type AppRouter = typeof appRouter;
