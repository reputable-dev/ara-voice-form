import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../../create-context";

// In-memory storage for demonstration
// In production, replace with a real database (PostgreSQL, MongoDB, etc.)
let users: any[] = [];
let userIdCounter = 1;

const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    }).optional())
    .mutation(({ input }) => {
      const user = {
        id: `user_${userIdCounter++}`,
        name: input?.name,
        email: input?.email,
        createdAt: Date.now(),
      };
      users.push(user);
      return user;
    }),

  list: publicProcedure.query(() => {
    return users;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return users.find(user => user.id === input.id) || null;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(({ input }) => {
      const userIndex = users.findIndex(user => user.id === input.id);
      if (userIndex === -1) {
        throw new Error("User not found");
      }
      
      users[userIndex] = {
        ...users[userIndex],
        ...input,
      };
      return users[userIndex];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const userIndex = users.findIndex(user => user.id === input.id);
      if (userIndex === -1) {
        throw new Error("User not found");
      }
      
      const deletedUser = users.splice(userIndex, 1)[0];
      return deletedUser;
    }),
});

export default userRouter;