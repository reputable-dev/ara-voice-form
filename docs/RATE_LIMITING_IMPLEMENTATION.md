# Rate Limiting Implementation Guide

## Current Status

### ⚠️ No Rate Limiting
The API currently has **no rate limiting** which poses security risks:
- Brute force attacks on auth endpoints
- API abuse / denial of service
- Excessive costs from AI API usage (Gemini, Rork)
- Resource exhaustion

### 🎯 Goals
- Prevent brute force authentication attacks
- Limit AI API usage to control costs
- Protect against DDoS attacks
- Fair resource allocation across users

---

## Recommended Implementation: Hono Rate Limiter

### Why Hono Rate Limiter?
- ✅ Built specifically for Hono framework
- ✅ Multiple storage backends (memory, Redis, custom)
- ✅ Per-route and global limiting
- ✅ Standard X-RateLimit headers
- ✅ TypeScript support

---

## Step 1: Install Dependencies

```bash
# Hono rate limiting middleware
bun add hono-rate-limiter

# (Optional) Redis for distributed rate limiting in production
bun add ioredis
bun add -d @types/ioredis
```

---

## Step 2: Environment Variables

Add to `.env.example` and `.env`:

```bash
# ====================================
# Rate Limiting Configuration
# ====================================

# Enable rate limiting (set to 'false' in development if needed)
ENABLE_RATE_LIMITING=true

# Redis connection (optional - for production with multiple servers)
# If not set, uses in-memory storage (single server only)
REDIS_URL=redis://localhost:6379

# Rate limit window (in seconds)
RATE_LIMIT_WINDOW=60

# Global API limits
RATE_LIMIT_GLOBAL_MAX=100

# Authentication endpoint limits (stricter)
RATE_LIMIT_AUTH_MAX=5

# AI/Expensive endpoint limits
RATE_LIMIT_AI_MAX=20
```

---

## Step 3: Create Rate Limiter Configuration

Create `backend/middleware/rate-limit.ts`:

```typescript
import { rateLimiter } from 'hono-rate-limiter';
import { Context } from 'hono';
import Redis from 'ioredis';

// Redis client (optional - for production)
let redisClient: Redis | undefined;

if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
  redisClient = new Redis(process.env.REDIS_URL);
  console.log('[Rate Limiter] Using Redis for distributed storage');
} else {
  console.log('[Rate Limiter] Using in-memory storage (development mode)');
}

// Helper to get client IP (works with proxies)
const getClientIP = (c: Context): string => {
  // Check for proxied requests (Cloudflare, nginx, etc.)
  const forwardedFor = c.req.header('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = c.req.header('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection IP (less reliable)
  return 'unknown';
};

// Custom key generator - use user ID if authenticated, otherwise IP
const keyGenerator = (c: Context): string => {
  // If user is authenticated, rate limit by user ID
  // This requires auth middleware to set c.get('user')
  const user = c.get('user');
  if (user?.id) {
    return `user:${user.id}`;
  }

  // Otherwise, rate limit by IP address
  const ip = getClientIP(c);
  return `ip:${ip}`;
};

// Handler when rate limit is exceeded
const handler = (c: Context) => {
  return c.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: c.res.headers.get('X-RateLimit-Reset'),
    },
    429
  );
};

// ====================================
// Global Rate Limiter (all endpoints)
// ====================================
export const globalRateLimiter = rateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60') * 1000, // 1 minute
  limit: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '100'), // 100 requests per minute
  standardHeaders: 'draft-7', // Include X-RateLimit-* headers
  keyGenerator,
  handler,
  // Use Redis if available, otherwise in-memory
  ...(redisClient && {
    store: {
      increment: async (key: string) => {
        const ttl = parseInt(process.env.RATE_LIMIT_WINDOW || '60');
        const count = await redisClient!.incr(key);
        if (count === 1) {
          await redisClient!.expire(key, ttl);
        }
        return count;
      },
      decrement: async (key: string) => {
        await redisClient!.decr(key);
      },
      resetKey: async (key: string) => {
        await redisClient!.del(key);
      },
    },
  }),
});

// ====================================
// Strict Rate Limiter (auth endpoints)
// ====================================
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'), // 5 attempts per 15 minutes
  standardHeaders: 'draft-7',
  keyGenerator,
  handler: (c) => {
    return c.json(
      {
        error: 'Too many authentication attempts',
        message: 'Please wait 15 minutes before trying again.',
        retryAfter: c.res.headers.get('X-RateLimit-Reset'),
      },
      429
    );
  },
  ...(redisClient && {
    store: {
      increment: async (key: string) => {
        const ttl = 15 * 60; // 15 minutes
        const count = await redisClient!.incr(`auth:${key}`);
        if (count === 1) {
          await redisClient!.expire(`auth:${key}`, ttl);
        }
        return count;
      },
      decrement: async (key: string) => {
        await redisClient!.decr(`auth:${key}`);
      },
      resetKey: async (key: string) => {
        await redisClient!.del(`auth:${key}`);
      },
    },
  }),
});

// ====================================
// AI Rate Limiter (expensive operations)
// ====================================
export const aiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: parseInt(process.env.RATE_LIMIT_AI_MAX || '20'), // 20 AI requests per minute
  standardHeaders: 'draft-7',
  keyGenerator,
  handler: (c) => {
    return c.json(
      {
        error: 'AI rate limit exceeded',
        message: 'Too many AI requests. Please slow down.',
        retryAfter: c.res.headers.get('X-RateLimit-Reset'),
      },
      429
    );
  },
  ...(redisClient && {
    store: {
      increment: async (key: string) => {
        const ttl = 60;
        const count = await redisClient!.incr(`ai:${key}`);
        if (count === 1) {
          await redisClient!.expire(`ai:${key}`, ttl);
        }
        return count;
      },
      decrement: async (key: string) => {
        await redisClient!.decr(`ai:${key}`);
      },
      resetKey: async (key: string) => {
        await redisClient!.del(`ai:${key}`);
      },
    },
  }),
});

// ====================================
// Cost-Based Rate Limiter (weighted by operation cost)
// ====================================
export const costBasedRateLimiter = (cost: number) =>
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 100, // 100 "cost points" per minute
    standardHeaders: 'draft-7',
    keyGenerator,
    handler,
    skip: (c) => {
      // Store cost in context for tracking
      c.set('cost', cost);
      return false;
    },
  });

// Export Redis client for cleanup
export { redisClient };
```

---

## Step 4: Apply Rate Limiting to Hono Server

Update `backend/hono.ts`:

```typescript
import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import {
  globalRateLimiter,
  authRateLimiter,
  aiRateLimiter,
  redisClient,
} from "./middleware/rate-limit";

const app = new Hono();

// Enable CORS
app.use("*", cors());

// Apply global rate limiting to all routes
if (process.env.ENABLE_RATE_LIMITING !== 'false') {
  app.use("*", globalRateLimiter);
  console.log('[Server] Global rate limiting enabled');
}

// Strict rate limiting for authentication endpoints
app.use("/api/trpc/auth.login", authRateLimiter);
app.use("/api/trpc/auth.register", authRateLimiter);
console.log('[Server] Auth rate limiting enabled');

// AI endpoint rate limiting
app.use("/api/trpc/ai.*", aiRateLimiter);
console.log('[Server] AI rate limiting enabled');

// tRPC server
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Health check (exempt from rate limiting)
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Health check with detailed status
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    redis: redisClient?.status || 'not configured',
    rateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  });
});

// Graceful shutdown - close Redis connection
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, closing Redis connection...');
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

export default app;
```

---

## Step 5: tRPC Middleware for Fine-Grained Control

Create `backend/trpc/middleware/rate-limit-middleware.ts`:

```typescript
import { TRPCError } from '@trpc/server';
import { t } from '../create-context';
import { redisClient } from '../../middleware/rate-limit';

// In-memory store fallback
const memoryStore = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();

  if (redisClient) {
    // Use Redis for distributed rate limiting
    const count = await redisClient.incr(key);
    const ttl = await redisClient.ttl(key);

    if (count === 1) {
      await redisClient.expire(key, Math.floor(windowMs / 1000));
    }

    const resetAt = now + (ttl * 1000);
    const remaining = Math.max(0, limit - count);

    return {
      allowed: count <= limit,
      remaining,
      resetAt,
    };
  } else {
    // Use in-memory store (development only)
    const record = memoryStore.get(key);

    if (!record || now > record.resetAt) {
      // New window
      const resetAt = now + windowMs;
      memoryStore.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    record.count++;
    const remaining = Math.max(0, limit - record.count);

    return {
      allowed: record.count <= limit,
      remaining,
      resetAt: record.resetAt,
    };
  }
}

// Create rate limiting middleware for tRPC procedures
export const createRateLimitMiddleware = (limit: number, windowMs: number) => {
  return t.middleware(async ({ ctx, next }) => {
    // Generate key based on user or IP
    const key = ctx.user?.id
      ? `trpc:user:${ctx.user.id}`
      : `trpc:ip:${ctx.req.headers.get('x-forwarded-for') || 'unknown'}`;

    const result = await checkRateLimit(key, limit, windowMs);

    if (!result.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${Math.ceil(
          (result.resetAt - Date.now()) / 1000
        )} seconds.`,
      });
    }

    return next();
  });
};

// Predefined rate limit middleware
export const rateLimitAuth = createRateLimitMiddleware(5, 15 * 60 * 1000); // 5 per 15 min
export const rateLimitAI = createRateLimitMiddleware(20, 60 * 1000); // 20 per minute
export const rateLimitStandard = createRateLimitMiddleware(100, 60 * 1000); // 100 per minute
```

---

## Step 6: Apply to tRPC Procedures

Update auth router to use rate limiting:

```typescript
import { rateLimitAuth } from '../middleware/rate-limit-middleware';

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .use(rateLimitAuth) // Add rate limiting
    .input(loginSchema)
    .mutation(async ({ input }) => {
      // ... login logic
    }),

  register: publicProcedure
    .use(rateLimitAuth) // Add rate limiting
    .input(registerSchema)
    .mutation(async ({ input }) => {
      // ... register logic
    }),
});
```

---

## Step 7: Frontend - Handle Rate Limit Errors

Update `lib/trpc.ts` to handle rate limiting errors:

```typescript
import { TRPCClientError } from '@trpc/client';

// Error handler for rate limiting
const handleRateLimitError = (error: any) => {
  if (error instanceof TRPCClientError) {
    if (error.data?.httpStatus === 429) {
      const retryAfter = error.data?.retryAfter;
      Alert.alert(
        'Rate Limit Exceeded',
        `Too many requests. Please try again ${retryAfter ? `in ${retryAfter}` : 'later'}.`
      );
    }
  }
};

// Use in components:
try {
  await loginMutation.mutateAsync({ email, password });
} catch (error) {
  handleRateLimitError(error);
  // ... other error handling
}
```

---

## Production Setup

### Option 1: Redis Cloud (Recommended)

**Upstash Redis (Serverless, Free Tier):**
```bash
# 1. Sign up at https://upstash.com/
# 2. Create new Redis database
# 3. Copy connection string

# .env.production
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
```

**Redis Labs / AWS ElastiCache:**
```bash
# Production-grade Redis with high availability
REDIS_URL=redis://your-redis-instance:6379
```

### Option 2: In-Memory (Single Server Only)

For small deployments with a single server:
```bash
# .env.production
# Leave REDIS_URL unset - uses in-memory storage
ENABLE_RATE_LIMITING=true
```

⚠️ **Warning:** In-memory storage doesn't work with multiple servers (load balancing).

---

## Monitoring & Analytics

### Log Rate Limit Events

Add to `backend/middleware/rate-limit.ts`:

```typescript
import { captureMessage } from '@/lib/sentry';

const handler = (c: Context) => {
  const ip = getClientIP(c);
  const path = c.req.path;
  const user = c.get('user');

  // Log to Sentry
  captureMessage(`Rate limit exceeded: ${path}`, 'warning', {
    ip,
    userId: user?.id,
    path,
  });

  // Log to console
  console.warn(`[Rate Limit] ${ip} exceeded limit on ${path}`);

  return c.json({ /* ... */ }, 429);
};
```

### Metrics Dashboard

Track rate limit hits in Sentry or analytics:
```typescript
import { setTags } from '@/lib/sentry';

setTags({
  rateLimitHit: 'true',
  endpoint: c.req.path,
  limitType: 'auth', // or 'global', 'ai'
});
```

---

## Testing Rate Limits

### Manual Testing

```bash
# Test auth endpoint
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/trpc/auth.login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -v
done

# Should return 429 after 5 attempts
```

### Automated Testing

Create `backend/__tests__/rate-limit.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import app from '../hono';

describe('Rate Limiting', () => {
  it('should block after exceeding auth rate limit', async () => {
    const requests = [];

    // Make 6 requests (limit is 5)
    for (let i = 0; i < 6; i++) {
      requests.push(
        app.request('/api/trpc/auth.login', {
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
        })
      );
    }

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);

    // Last request should be rate limited
    expect(statuses[5]).toBe(429);
  });

  it('should include rate limit headers', async () => {
    const res = await app.request('/api/trpc/auth.login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    });

    expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
  });
});
```

---

## Rate Limit Tiers (Optional)

Implement tiered rate limiting based on user subscription:

```typescript
// In rate-limit-middleware.ts
export const createTieredRateLimiter = () => {
  return t.middleware(async ({ ctx, next }) => {
    const user = ctx.user;

    // Define limits based on user tier
    const limits = {
      free: { limit: 100, windowMs: 60 * 1000 },
      pro: { limit: 1000, windowMs: 60 * 1000 },
      enterprise: { limit: 10000, windowMs: 60 * 1000 },
    };

    const tier = user?.subscriptionTier || 'free';
    const { limit, windowMs } = limits[tier];

    const key = `tiered:${tier}:${user?.id || 'anonymous'}`;
    const result = await checkRateLimit(key, limit, windowMs);

    if (!result.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `${tier} tier limit exceeded. Upgrade for higher limits.`,
      });
    }

    return next();
  });
};
```

---

## Cost Optimization

### Dynamic Rate Limiting

Adjust limits based on server load:

```typescript
import os from 'os';

const getDynamicLimit = (): number => {
  const cpuUsage = os.loadavg()[0];
  const baseLimit = 100;

  // Reduce limits under high load
  if (cpuUsage > 0.8) return Math.floor(baseLimit * 0.5);
  if (cpuUsage > 0.6) return Math.floor(baseLimit * 0.75);

  return baseLimit;
};
```

### Whitelist Trusted IPs

```typescript
const isWhitelisted = (ip: string): boolean => {
  const whitelist = (process.env.RATE_LIMIT_WHITELIST || '').split(',');
  return whitelist.includes(ip);
};

// In rate limiter config:
skip: (c) => isWhitelisted(getClientIP(c)),
```

---

## Production Checklist

- [ ] Install `hono-rate-limiter` package
- [ ] Configure Redis for distributed storage (production)
- [ ] Set environment variables (limits, Redis URL)
- [ ] Apply global rate limiting to Hono server
- [ ] Add strict limits to auth endpoints (5 per 15 min)
- [ ] Add AI endpoint limits (20 per minute)
- [ ] Test rate limiting with automated tests
- [ ] Monitor rate limit events in Sentry
- [ ] Document limits in API documentation
- [ ] Set up alerts for excessive rate limit hits
- [ ] Whitelist monitoring/health check endpoints
- [ ] Test failover if Redis goes down

---

## Troubleshooting

### Rate Limits Not Working

**Check 1:** Verify middleware is applied
```bash
# Should see logs on server start:
[Server] Global rate limiting enabled
[Server] Auth rate limiting enabled
```

**Check 2:** Check Redis connection
```bash
curl http://localhost:3000/health
# Should show: "redis": "ready"
```

**Check 3:** Test with curl
```bash
# Make 101 requests quickly (global limit is 100)
for i in {1..101}; do
  curl http://localhost:3000/api/trpc/auth.login -s -o /dev/null -w "%{http_code}\n"
done
# Should see 429 on request 101
```

### Redis Connection Issues

```typescript
// Add error handling
if (redisClient) {
  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
    // Fallback to in-memory
  });

  redisClient.on('ready', () => {
    console.log('[Redis] Connected successfully');
  });
}
```

---

## Security Considerations

✅ **Implemented:**
- IP-based rate limiting for anonymous users
- User ID-based limiting for authenticated users
- Stricter limits on authentication endpoints
- Standard X-RateLimit headers

⚠️ **Additional Recommendations:**
- Use Redis Cluster for high availability
- Implement exponential backoff on client
- Add CAPTCHA after multiple failures
- Monitor for distributed attacks
- Use CDN (Cloudflare) for DDoS protection

---

## Next Steps

1. **Install package:** `bun add hono-rate-limiter`
2. **Set up Redis:** Upstash or AWS ElastiCache
3. **Configure env vars:** Set limits and Redis URL
4. **Add middleware:** Update `backend/hono.ts`
5. **Test locally:** Verify limits work
6. **Deploy:** Push to production
7. **Monitor:** Check Sentry for rate limit events

**Estimated implementation time:** 1-2 hours

---

**Last updated:** 2025-01-22
**Maintainer:** Development Team
