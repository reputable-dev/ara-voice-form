// @ts-nocheck
import { mutation, query } from "./_generated/server";

export const createContract = mutation({
  handler: async (ctx, args: { 
    title?: string; 
    content?: string; 
    analysis?: string; 
    userId: string 
  }) => {
    const contractId = await ctx.db.insert("contracts", {
      title: args.title,
      content: args.content,
      analysis: args.analysis,
      userId: args.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return contractId;
  },
});

export const getContract = query({
  handler: async (ctx, args: { id: string }) => {
    const contract = await ctx.db.get(args.id);
    return contract;
  },
});

export const getUserContracts = query({
  handler: async (ctx, args: { userId: string }) => {
    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return contracts;
  },
});

export const updateContract = mutation({
  handler: async (ctx, args: { 
    id: string; 
    title?: string; 
    content?: string; 
    analysis?: string 
  }) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    const updatedContract = await ctx.db.get(id);
    return updatedContract;
  },
});

export const deleteContract = mutation({
  handler: async (ctx, args: { id: string }) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});