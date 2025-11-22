// @ts-nocheck
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  handler: async (ctx, args: { name?: string; email?: string }) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
    });
    return userId;
  },
});

export const getUser = query({
  handler: async (ctx, args: { id: string }) => {
    const user = await ctx.db.get(args.id);
    return user;
  },
});

export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

export const updateUser = mutation({
  handler: async (ctx, args: { id: string; name?: string; email?: string }) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    const updatedUser = await ctx.db.get(id);
    return updatedUser;
  },
});

export const deleteUser = mutation({
  handler: async (ctx, args: { id: string }) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});