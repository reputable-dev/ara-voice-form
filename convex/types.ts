/**
 * Manual type definitions for Convex
 * This replaces the corrupted generated files
 */

// Document types
export interface User {
  _id: string;
  _creationTime: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface Contract {
  _id: string;
  _creationTime: number;
  userId: string;
  title: string;
  content: string;
  status: "draft" | "active" | "completed";
  createdAt: number;
  updatedAt: number;
}

// Function types
export interface MutationCtx {
  db: {
    get: (id: string) => Promise<any>;
    query: (table: any) => any;
    insert: (table: string, doc: any) => Promise<any>;
    patch: (id: string, updates: any) => Promise<any>;
    replace: (id: string, doc: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
  };
  auth: any;
  scheduler: any;
  storage: any;
}

export interface QueryCtx {
  db: {
    get: (id: string) => Promise<any>;
    query: (table: any) => any;
  };
  auth: any;
  scheduler: any;
  storage: any;
}

// Function signatures
export type MutationFunction<Args extends any[], Return> = (
  ctx: MutationCtx,
  ...args: Args
) => Return;

export type QueryFunction<Args extends any[], Return> = (
  ctx: QueryCtx,
  ...args: Args
) => Return;