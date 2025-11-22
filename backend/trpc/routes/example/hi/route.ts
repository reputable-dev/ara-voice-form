import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export default publicProcedure
  .input(z.object({ name: z.string() }).optional())
  .mutation(({ input }) => {
    return {
      hello: input?.name || "World",
      date: new Date(),
    };
  });
