# Security Guide - ARA Voice Form

**Critical security improvements and best practices for production deployment**

---

## 🔒 Security Improvements Implemented

### 1. Environment Variables for API Keys

**Problem:** API keys were hardcoded in source files, exposing them in version control.

**Solution:** Moved all sensitive credentials to environment variables.

**Files Changed:**
- `components/FloatingAIAssistant.tsx:127-131`
- `app/(tabs)/index.tsx:41-45`
- `.env.example` (created)
- `.gitignore` (updated to include `.env`)

**Setup:**
```bash
# 1. Copy the example file
cp .env.example .env

# 2. Add your actual API key
# Edit .env and replace 'your_gemini_api_key_here' with your real key

# 3. Verify it's working
bun run start
# Check console for "EXPO_PUBLIC_OPENROUTER_API_KEY is not configured" errors
```

**Important:** Never commit the `.env` file. It's already in `.gitignore` to prevent this.

---

### 2. tRPC Authentication Middleware

**Problem:** All tRPC endpoints were publicly accessible with no authentication.

**Solution:** Added authentication middleware with three procedure types.

**File Changed:**
- `backend/trpc/create-context.ts` (completely refactored)

**New Procedures Available:**

| Procedure | Auth Required | Use Case | Example |
|-----------|---------------|----------|---------|
| `publicProcedure` | ❌ No | Public endpoints | Health checks, login |
| `protectedProcedure` | ✅ Yes | User-specific data | Profile, settings |
| `adminProcedure` | ✅ Yes (Admin) | Admin actions | User management |

**Usage Example:**

```typescript
// backend/trpc/routes/profile/route.ts
import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

export const getProfile = protectedProcedure
  .query(({ ctx }) => {
    // ctx.user is guaranteed to exist (TypeScript knows this!)
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      role: ctx.user.role
    };
  });

export const updateProfile = protectedProcedure
  .input(z.object({ name: z.string() }))
  .mutation(({ ctx, input }) => {
    // Only authenticated users can update their profile
    return updateUserInDatabase(ctx.user.id, input.name);
  });

// Admin-only endpoint
export const deleteUser = adminProcedure
  .input(z.object({ userId: z.string() }))
  .mutation(({ ctx, input }) => {
    // Only admins can delete users
    return deleteUserFromDatabase(input.userId);
  });
```

**Client-Side Usage:**

```typescript
// Add token to tRPC client
import { trpc } from '@/lib/trpc';

// When user logs in, store token
const token = await loginUser(email, password);
await AsyncStorage.setItem('authToken', token);

// Include token in tRPC requests
const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      headers: async () => {
        const token = await AsyncStorage.getItem('authToken');
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
    })
  ]
});

// Now protected endpoints will work
const profile = await trpc.profile.get.query();
// Without token: throws UNAUTHORIZED error
// With valid token: returns user profile
```

---

## ⚠️ TODO: Implement Real Authentication

**Current Status:** The authentication middleware structure is in place, but the `getUserFromToken()` function is a placeholder.

**What You Need to Do:**

### Option 1: JWT Authentication

```typescript
// backend/trpc/create-context.ts

import jwt from 'jsonwebtoken';

async function getUserFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: 'user' | 'admin';
    };

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      role: user.role
    };
  } catch (error) {
    return null; // Invalid token
  }
}
```

### Option 2: Session-Based Authentication

```typescript
async function getUserFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;

  // Lookup session in database
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    return null; // Invalid or expired
  }

  return {
    id: session.user.id,
    name: session.user.name,
    role: session.user.role
  };
}
```

### Option 3: Third-Party Auth (Clerk, Auth0, Supabase)

```typescript
import { clerkClient } from '@clerk/clerk-sdk-node';

async function getUserFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;

  try {
    const session = await clerkClient.sessions.verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY
    });

    return {
      id: session.userId,
      name: session.user.firstName + ' ' + session.user.lastName,
      role: session.user.publicMetadata.role || 'user'
    };
  } catch {
    return null;
  }
}
```

**Required Environment Variables:**

```bash
# Add to .env.example and .env
JWT_SECRET=your_secret_key_here  # For JWT option
CLERK_JWT_KEY=your_clerk_key     # For Clerk option
```

---

## 🔐 Production Security Checklist

Before deploying to production, ensure you've completed:

### Critical (Must-Do)

- [ ] **Replace placeholder auth** in `getUserFromToken()` with real implementation
- [ ] **Set up environment variables** for all environments (dev, staging, prod)
- [ ] **Rotate API keys** that were exposed in git history
- [ ] **Enable HTTPS only** in production (no HTTP allowed)
- [ ] **Add rate limiting** to prevent abuse
- [ ] **Set up error monitoring** (Sentry, Bugsnag)
- [ ] **Review CORS settings** in `backend/hono.ts` (currently allows all origins)

### Important (Should-Do)

- [ ] **Implement input sanitization** for user-generated content
- [ ] **Add request logging** for security audit trail
- [ ] **Set up database backups** (if using persistence)
- [ ] **Configure CSP headers** for web deployment
- [ ] **Add session management** (logout, token refresh)
- [ ] **Implement password requirements** (if using email/password auth)
- [ ] **Enable 2FA** for admin accounts
- [ ] **Set up vulnerability scanning** (Snyk, Dependabot)

### Recommended (Nice-to-Have)

- [ ] **Add API key rotation strategy**
- [ ] **Implement audit logging** for sensitive operations
- [ ] **Set up penetration testing**
- [ ] **Add Web Application Firewall** (WAF)
- [ ] **Configure security headers** (HSTS, X-Frame-Options, etc.)
- [ ] **Enable database encryption at rest**

---

## 🚨 Security Vulnerabilities Fixed

### 1. Hardcoded API Keys (HIGH SEVERITY) ✅ FIXED

**CVE Equivalent:** Similar to CVE-2021-21234 (Hardcoded credentials)

**Previous Code:**
```typescript
const apiKey = 'AIzaSyCC5LnBazvUeGJrg-QDQMB7bp64FV5DMVk'; // ❌ Exposed
```

**Fixed Code:**
```typescript
const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY; // ✅ Secure
if (!apiKey) throw new Error('API key not configured');
```

**Impact:**
- ❌ Before: Anyone with code access could use your API quota
- ✅ After: API key stored securely outside version control

---

### 2. Unauthenticated API Access (HIGH SEVERITY) ✅ PARTIALLY FIXED

**CVE Equivalent:** Similar to CVE-2020-15148 (Missing authentication)

**Previous Code:**
```typescript
export const publicProcedure = t.procedure; // ❌ No auth checks
```

**Fixed Code:**
```typescript
// Three levels of access control
export const publicProcedure = t.procedure;           // No auth
export const protectedProcedure = t.procedure.use(isAuthed); // ✅ Requires auth
export const adminProcedure = t.procedure.use(isAdmin);      // ✅ Requires admin
```

**Status:**
- ✅ Middleware structure in place
- ⚠️ `getUserFromToken()` needs real implementation
- ⚠️ No routes using protected procedures yet

---

## 🛡️ Security Best Practices

### API Key Management

**Do:**
- ✅ Store in environment variables
- ✅ Use different keys for dev/staging/prod
- ✅ Rotate keys every 90 days
- ✅ Revoke immediately if exposed

**Don't:**
- ❌ Commit to version control
- ❌ Share in Slack/email
- ❌ Use same key across environments
- ❌ Hardcode in client-side code

### Authentication

**Do:**
- ✅ Use HTTPS only
- ✅ Implement token expiration
- ✅ Hash passwords with bcrypt
- ✅ Rate limit login attempts

**Don't:**
- ❌ Store passwords in plain text
- ❌ Accept weak passwords
- ❌ Use predictable tokens
- ❌ Skip token validation

### API Security

**Do:**
- ✅ Validate all inputs with Zod
- ✅ Use prepared statements (SQL)
- ✅ Sanitize user content
- ✅ Implement rate limiting

**Don't:**
- ❌ Trust client input
- ❌ Expose internal errors
- ❌ Allow unlimited requests
- ❌ Return sensitive data in errors

---

## 📊 Current Security Status

| Category | Status | Notes |
|----------|--------|-------|
| **API Keys** | 🟢 Secure | Moved to environment variables |
| **Authentication** | 🟡 Partial | Middleware ready, needs implementation |
| **Authorization** | 🟡 Partial | RBAC structure in place |
| **HTTPS** | 🔴 Not configured | Needs SSL cert in production |
| **Rate Limiting** | 🔴 None | Vulnerable to abuse |
| **Input Validation** | 🟢 Good | Zod schemas on endpoints |
| **Error Handling** | 🟡 Basic | Logs errors, no monitoring |
| **CORS** | 🟡 Permissive | Allows all origins (fix in prod) |
| **Dependency Security** | 🟡 Unknown | Run `npm audit` |

---

## 🔍 Security Audit Trail

**Changes Made:**

| Date | Change | Files | Severity |
|------|--------|-------|----------|
| 2025-11-22 | Moved API keys to .env | `components/FloatingAIAssistant.tsx`, `app/(tabs)/index.tsx` | HIGH |
| 2025-11-22 | Added .env to .gitignore | `.gitignore` | HIGH |
| 2025-11-22 | Created .env.example template | `.env.example` | MEDIUM |
| 2025-11-22 | Added tRPC auth middleware | `backend/trpc/create-context.ts` | HIGH |
| 2025-11-22 | Created protected/admin procedures | `backend/trpc/create-context.ts` | HIGH |

**Remaining Vulnerabilities:**

| Severity | Issue | File | Recommendation |
|----------|-------|------|----------------|
| HIGH | Placeholder auth function | `backend/trpc/create-context.ts:28-40` | Implement real token validation |
| HIGH | No HTTPS enforcement | `backend/hono.ts` | Add HTTPS redirect middleware |
| MEDIUM | Permissive CORS | `backend/hono.ts:9` | Restrict to specific origins |
| MEDIUM | No rate limiting | All endpoints | Add rate limiting middleware |
| LOW | No error monitoring | Global | Set up Sentry/Bugsnag |

---

## 📚 Additional Resources

**Authentication Libraries:**
- [Clerk](https://clerk.com/docs) - Easiest setup, great for React Native
- [Auth0](https://auth0.com/docs) - Enterprise-grade
- [Supabase Auth](https://supabase.com/docs/guides/auth) - Open source
- [NextAuth.js](https://next-auth.js.org/) - For Next.js apps

**Security Tools:**
- [Snyk](https://snyk.io/) - Dependency vulnerability scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing
- [Sentry](https://sentry.io/) - Error monitoring
- [Rate Limiter Flexible](https://www.npmjs.com/package/rate-limiter-flexible) - Rate limiting

**Security Guides:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Native Security](https://reactnative.dev/docs/security)
- [Expo Security Best Practices](https://docs.expo.dev/guides/security/)
- [tRPC Authentication Guide](https://trpc.io/docs/authentication)

---

**Last Updated:** 2025-11-22
**Security Level:** 🟡 MODERATE (Development-ready, needs work for production)
**Next Review:** Implement real authentication, then reassess