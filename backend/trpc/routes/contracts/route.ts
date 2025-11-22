import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../../create-context";

// In-memory storage for demonstration
// In production, replace with a real database (PostgreSQL, MongoDB, etc.)
let contracts: any[] = [];
let contractIdCounter = 1;

const contractRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      analysis: z.string().optional(),
      userId: z.string().optional(),
    }).optional())
    .mutation(({ input }) => {
      const contract = {
        id: `contract_${contractIdCounter++}`,
        title: input?.title,
        content: input?.content,
        analysis: input?.analysis,
        userId: input?.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      contracts.push(contract);
      return contract;
    }),

  list: publicProcedure.query(() => {
    return contracts;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return contracts.find(contract => contract.id === input.id) || null;
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return contracts.filter(contract => contract.userId === input.userId);
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      analysis: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const contractIndex = contracts.findIndex(contract => contract.id === input.id);
      if (contractIndex === -1) {
        throw new Error("Contract not found");
      }
      
      contracts[contractIndex] = {
        ...contracts[contractIndex],
        ...input,
        updatedAt: Date.now(),
      };
      return contracts[contractIndex];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const contractIndex = contracts.findIndex(contract => contract.id === input.id);
      if (contractIndex === -1) {
        throw new Error("Contract not found");
      }
      
      const deletedContract = contracts.splice(contractIndex, 1)[0];
      return deletedContract;
    }),
});

export default contractRouter;