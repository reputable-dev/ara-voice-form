import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../../create-context";

// In-memory storage for demonstration
// In production, replace with a real database (PostgreSQL, MongoDB, etc.)
let users: any[] = [];
let contracts: any[] = [];
let transcriptions: any[] = [];
let formFields: any[] = [];

// Counter for generating IDs
let userIdCounter = 1;
let contractIdCounter = 1;
let transcriptionIdCounter = 1;
let formFieldIdCounter = 1;

// Create a new user
export const createUser = publicProcedure
  .input(z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
  }))
  .mutation(({ input }) => {
    const user = {
      id: `user_${userIdCounter++}`,
      name: input.name,
      email: input.email,
      createdAt: Date.now(),
    };
    users.push(user);
    return user;
  });

// Get all users
export const getUsers = publicProcedure.query(() => {
  return users;
});

// Get user by ID
export const getUserById = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(({ input }) => {
    return users.find(user => user.id === input.id) || null;
  });

// Update user
export const updateUser = publicProcedure
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
  });

// Delete user
export const deleteUser = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(({ input }) => {
    const userIndex = users.findIndex(user => user.id === input.id);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    return deletedUser;
  });