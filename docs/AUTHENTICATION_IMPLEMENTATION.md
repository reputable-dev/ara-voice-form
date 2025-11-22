# Authentication Implementation Guide

## Current Status

### ✅ Infrastructure Ready
- tRPC context with user extraction (`backend/trpc/create-context.ts`)
- Authentication middleware (`isAuthed`, `isAdmin`)
- Protected procedures (`protectedProcedure`, `adminProcedure`)
- User type definition

### ⚠️ Missing Implementation
- Token validation logic in `getUserFromToken()`
- Auth library/strategy
- Login/Register endpoints
- Frontend login UI
- Token storage

---

## Recommended Implementation: JWT-Based Auth

For a React Native + Expo + tRPC app, **JWT (JSON Web Tokens)** provides:
- ✅ Stateless authentication
- ✅ Works across mobile and web
- ✅ No third-party dependencies
- ✅ Complete control over auth flow

### Architecture Overview

```
┌─────────────┐        ┌──────────────┐        ┌──────────────┐
│   Client    │──────▶ │  tRPC Login  │──────▶ │  Validate    │
│  (React     │  POST  │  Endpoint    │        │  Credentials │
│   Native)   │        └──────────────┘        └──────────────┘
└─────────────┘              │                         │
      │                      ▼                         ▼
      │              Generate JWT Token         Check Database
      │                      │
      │◀─────────────────────┘
      │    Return: { token, user }
      │
      ▼
Store in SecureStore
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Future API Requests:                                       │
│  Authorization: Bearer <token>                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Install Dependencies

```bash
# JWT library for token generation/validation
bun add jsonwebtoken
bun add -d @types/jsonwebtoken

# Password hashing
bun add bcryptjs
bun add -d @types/bcryptjs

# Secure storage for React Native
bunx expo install expo-secure-store

# (Optional) Database client - choose one:
# bun add @prisma/client  # If using Prisma
# bun add drizzle-orm     # If using Drizzle
# bun add pg              # If using raw PostgreSQL
```

---

## Step 2: Environment Variables

Add to `.env.example` and `.env`:

```bash
# JWT Secret Key (MUST be 32+ random characters)
# Generate with: openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long

# JWT Expiration (default: 7 days)
JWT_EXPIRES_IN=7d

# Refresh token expiration (default: 30 days)
REFRESH_TOKEN_EXPIRES_IN=30d
```

**⚠️ Security:** Never commit actual `JWT_SECRET` to git. Use different secrets for dev/staging/prod.

---

## Step 3: Implement Token Validation

Replace `getUserFromToken()` in `backend/trpc/create-context.ts`:

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

async function getUserFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;

  try {
    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Optional: Check token against database revocation list
    // const isRevoked = await db.revokedToken.findUnique({ where: { token } });
    // if (isRevoked) return null;

    // Optional: Fetch fresh user data from database
    // const user = await db.user.findUnique({ where: { id: decoded.userId } });
    // if (!user) return null;

    // Return user from token payload
    return {
      id: decoded.userId,
      name: decoded.email.split('@')[0], // Or fetch from database
      role: decoded.role,
    };
  } catch (error) {
    // Token is invalid, expired, or malformed
    console.error('Token validation error:', error);
    return null;
  }
}
```

---

## Step 4: Create Auth Router

Create `backend/trpc/routes/auth/auth.router.ts`:

```typescript
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../../create-context';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// In-memory user store (replace with database in production)
const users: Array<{
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'user' | 'admin';
}> = [];

export const authRouter = createTRPCRouter({
  // Register new user
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existingUser = users.find(u => u.email === input.email);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create user
      const user = {
        id: crypto.randomUUID(),
        email: input.email,
        passwordHash,
        name: input.name,
        role: 'user' as const,
      };

      users.push(user);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  // Login existing user
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      // Find user
      const user = users.find(u => u.email === input.email);
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  // Get current user (protected route)
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  // Logout (client-side only - just delete token)
  logout: protectedProcedure.mutation(() => {
    // In a more sophisticated setup, add token to revocation list
    // await db.revokedToken.create({ data: { token: ctx.token } });
    return { success: true };
  }),

  // Change password (protected route)
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = users.find(u => u.id === ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Verify current password
      const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      user.passwordHash = await bcrypt.hash(input.newPassword, 10);

      return { success: true };
    }),
});
```

---

## Step 5: Add Auth Router to App Router

Update `backend/trpc/app-router.ts`:

```typescript
import { createTRPCRouter } from './create-context';
import { authRouter } from './routes/auth/auth.router';
// ... other routers

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // ... other routers
});

export type AppRouter = typeof appRouter;
```

---

## Step 6: Frontend - Token Storage

Create `lib/auth-storage.ts`:

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

export const authStorage = {
  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      // Use SecureStore for mobile
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  },

  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  },

  async removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
};
```

---

## Step 7: Frontend - Auth Context

Create `contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { authStorage } from '@/lib/auth-storage';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
} | null;

interface AuthContextValue {
  user: User;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  // Load token on mount
  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await authStorage.getToken();
      if (storedToken) {
        setToken(storedToken);
        // Optionally fetch user data
        // const userData = await trpc.auth.me.query();
        // setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    await authStorage.setToken(result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await registerMutation.mutateAsync({ email, password, name });
    await authStorage.setToken(result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    await authStorage.removeToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## Step 8: Update tRPC Client to Include Auth Token

Update `lib/trpc.ts`:

```typescript
import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { authStorage } from "./auth-storage";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }
  throw new Error("No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL");
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      // Add authorization header to all requests
      headers: async () => {
        const token = await authStorage.getToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
```

---

## Step 9: Frontend - Login UI

Create `components/LoginScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    try {
      if (isRegisterMode) {
        await register(email, password, name);
        Alert.alert('Success', 'Account created successfully');
      } else {
        await login(email, password);
        Alert.alert('Success', 'Logged in successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegisterMode ? 'Register' : 'Login'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {isRegisterMode && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>
          {isRegisterMode ? 'Create Account' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegisterMode(!isRegisterMode)}>
        <Text style={styles.switchText}>
          {isRegisterMode
            ? 'Already have an account? Login'
            : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0A0A0A',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#10B981',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});
```

---

## Step 10: Protect Routes

Update `app/_layout.tsx` to wrap with `AuthProvider`:

```typescript
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginScreen from '@/components/LoginScreen';

function ProtectedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.gestureHandler}>
              <ProtectedApp />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

---

## Production Checklist

Before deploying to production:

- [ ] Replace in-memory user store with database (PostgreSQL, MongoDB, etc.)
- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Implement password reset flow
- [ ] Add email verification
- [ ] Implement token refresh mechanism
- [ ] Add rate limiting on auth endpoints (see RATE_LIMITING.md)
- [ ] Set up token revocation (blacklist)
- [ ] Add multi-factor authentication (optional)
- [ ] Implement account lockout after failed attempts
- [ ] Add CSRF protection for web
- [ ] Test all error scenarios
- [ ] Set up monitoring for auth failures

---

## Security Best Practices

✅ **Password Security:**
- Minimum 8 characters
- Use bcrypt with cost factor 10+
- Never log passwords
- Hash before storing

✅ **Token Security:**
- Use HTTPS only in production
- Set short expiration (7 days recommended)
- Implement refresh tokens for long sessions
- Store securely (SecureStore on mobile, httpOnly cookies on web)

✅ **API Security:**
- Rate limit authentication endpoints
- Log all authentication attempts
- Monitor for brute force attacks
- Implement account lockout

---

## Alternative: Using Clerk (Third-Party)

For enterprise-ready auth with minimal code:

```bash
bun add @clerk/clerk-expo
```

Benefits:
- Pre-built UI components
- Social login (Google, GitHub, etc.)
- MFA built-in
- User management dashboard
- No backend auth code needed

See [Clerk documentation](https://clerk.com/docs/quickstarts/expo) for setup.

---

## Next Steps

1. **Install dependencies:** `bun add jsonwebtoken bcryptjs`
2. **Set JWT_SECRET:** Add to `.env` file
3. **Implement token validation:** Update `getUserFromToken()`
4. **Create auth router:** Add `auth.router.ts`
5. **Add to app router:** Include in `app-router.ts`
6. **Test endpoints:** Use Postman or tRPC panel
7. **Build frontend:** Login screen + auth context
8. **Integrate:** Connect UI to backend
9. **Test flow:** Register → Login → Protected route
10. **Add database:** Replace in-memory storage

**Estimated implementation time:** 3-4 hours

---

**Last updated:** 2025-01-22
**Maintainer:** Development Team
