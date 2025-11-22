import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

// Simple user type for demonstration
// In production, replace with your actual user model
export type User = {
  id: string;
  name: string;
  role: 'user' | 'admin';
};

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Extract token from Authorization header
  const token = opts.req.headers.get('authorization')?.replace('Bearer ', '');

  // Validate token and get user
  // This is a placeholder - replace with your actual auth logic
  const user = await getUserFromToken(token);

  return {
    req: opts.req,
    user, // null if not authenticated
  };
};

// Placeholder auth function - replace with your actual implementation
async function getUserFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;

  // TODO: Replace with actual token validation
  // Examples:
  // - JWT validation: const decoded = jwt.verify(token, SECRET);
  // - Session lookup: const session = await db.session.findUnique({ where: { token } });
  // - Third-party auth: const user = await clerk.users.getUser(token);

  // For now, return null (unauthenticated)
  // Remove this and add real auth before production!
  return null;
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Authentication middleware
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource'
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type-safe user object
    },
  });
});

// Admin-only middleware
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const createTRPCRouter = t.router;

// Public procedure (no auth required)
export const publicProcedure = t.procedure;

// Protected procedure (authentication required)
export const protectedProcedure = t.procedure.use(isAuthed);

// Admin procedure (admin role required)
export const adminProcedure = t.procedure.use(isAdmin);
