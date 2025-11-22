# Migration Guide: tRPC to Convex (convexpo pattern)

## 🔄 Quick Migration Steps

### 1. Update App Layout
Replace `ConvexClientProvider` with new `ConvexProvider`:

```typescript
// Before
import { ConvexClientProvider } from "@/lib/trpc";

// After  
import ConvexProvider from "@/providers/ConvexProvider";

// In RootLayout:
export default function RootLayout() {
  return (
    <ConvexProvider>  // Replace ConvexClientProvider
      <QueryClientProvider client={queryClient}>
        {/* rest remains same */}
      </QueryClientProvider>
    </ConvexProvider>
  );
}
```

### 2. Update Environment Variables
Add to `.env`:
```bash
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 3. Replace tRPC Calls with Convex Functions

#### Example: Voice Recording Component
```typescript
// Before (tRPC)
import { trpc } from "@/lib/trpc";

const { mutate: generateText } = trpc.ai.generateText.useMutation();

const handleTranscription = async (audioData) => {
  const result = await generateText({ prompt: audioData });
  return result;
};

// After (Convex)
import { useMutation } from "convex/react";

const generateText = useMutation("api.api.generateText");

const handleTranscription = async (audioData) => {
  const result = await generateText({ prompt: audioData });
  return result;
};
```

#### Example: User Operations
```typescript
// Before (tRPC)
const { mutate: createUser } = trpc.users.create.useMutation();
const { data: user } = trpc.users.get.useQuery({ email });

// After (Convex)
const createUser = useMutation("api.users.create");
const { data: user } = useQuery("api.users.get", { email });
```

### 4. Update Component Imports

#### VoiceRecorder.tsx
```typescript
// Replace tRPC imports
- import { trpc } from "@/lib/trpc";
+ import { useMutation } from "convex/react";

// Replace function calls
- const generateText = trpc.ai.generateText.useMutation();
+ const generateText = useMutation("api.api.generateText");
```

#### VoiceEdit.tsx
```typescript
// Replace smart edit function
- const smartEdit = trpc.ai.smartEdit.useMutation();
+ const smartEdit = useMutation("api.api.smartEdit");
```

### 5. Function Mapping

| tRPC Function | Convex Function |
|---------------|-----------------|
| `trpc.ai.generateText` | `useMutation("api.api.generateText")` |
| `trpc.ai.transcribeAudio` | `useMutation("api.api.transcribeAudio")` |
| `trpc.ai.smartEdit` | `useMutation("api.api.smartEdit")` |
| `trpc.users.create` | `useMutation("api.users.create")` |
| `trpc.users.get` | `useQuery("api.users.get", { email })` |
| `trpc.contracts.create` | `useMutation("api.contracts.create")` |
| `trpc.contracts.list` | `useQuery("api.contracts.list", { userId })` |

## 🚀 Deployment Commands

### Setup Convex Project
```bash
npx convex dev
```

### Deploy to Production
```bash
npx convex deploy --yes
```

### Set Environment Variables
```bash
npx convex env set OPENROUTER_API_KEY your_key_here
npx convex env set ELEVENLABS_API_KEY your_key_here
```

## ✅ Benefits of Convex

- **Real-time Updates**: Automatic data synchronization
- **Type Safety**: End-to-end TypeScript types
- **Serverless**: No server management needed
- **Edge Functions**: Global deployment for low latency
- **Built-in Database**: No separate database setup needed

## 📱 Testing the Migration

1. Deploy Convex backend
2. Update environment variables
3. Replace tRPC calls in components
4. Test voice recording and AI features
5. Verify real-time data sync

Your app will have better performance and real-time capabilities with Convex!