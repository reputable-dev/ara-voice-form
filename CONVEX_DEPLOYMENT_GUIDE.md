# Convex Deployment Guide for ARA Voice Form

## 🚀 Quick Setup Commands

### 1. Configure Convex Project
```bash
npx convex dev
```
This will:
- Create or link your Convex project
- Generate TypeScript types
- Push schema to development deployment

### 2. Deploy to Production
```bash
npx convex deploy --yes
```

### 3. Set Environment Variables
```bash
npx convex env set OPENROUTER_API_KEY your_key_here
npx convex env set ELEVENLABS_API_KEY your_key_here
```

### 4. Get Your Convex URL
```bash
npx convex dashboard
```
Your URL will be: `https://your-project.convex.cloud`

## 📱 Update Mobile App Configuration

Add to your `.env` file:
```bash
CONVEX_URL=https://your-project.convex.cloud
```

Update your app to use Convex client instead of tRPC:
```typescript
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

function App() {
  return (
    <ConvexProvider client={convex}>
      {/* Your app components */}
    </ConvexProvider>
  );
}
```

## 🔧 Available Functions

Your Convex backend includes these functions:

### API Functions
- `api.api.generateText` - AI text generation via OpenRouter
- `api.api.transcribeAudio` - Speech-to-text via ElevenLabs  
- `api.api.smartEdit` - Context-aware field editing
- `api.api.healthCheck` - Backend health check

### Database Functions  
- `api.users.create` - Create user
- `api.users.get` - Get user by email
- `api.contracts.create` - Create contract
- `api.contracts.list` - List user contracts

## 🌐 Usage Examples

### Generate AI Text
```typescript
import { useMutation } from "convex/react";

const generateText = useMutation("api.api.generateText");

const result = await generateText({
  prompt: "Help me fill this form...",
  context: "Form filling assistant"
});
```

### Smart Edit Field
```typescript
const smartEdit = useMutation("api.api.smartEdit");

const result = await smartEdit({
  currentValue: "John Doe",
  instruction: "Change to Jane Smith", 
  fieldName: "fullName"
});
```

## 🔄 Migration from tRPC

Replace tRPC calls with Convex mutations/queries:

### Before (tRPC):
```typescript
const { mutate } = trpc.ai.generateText.useMutation();
mutate({ prompt });
```

### After (Convex):
```typescript
const generateText = useMutation("api.api.generateText");
generateText({ prompt });
```

## 📊 Production Features

✅ **Real-time Updates** - Automatic data synchronization  
✅ **Type Safety** - End-to-end TypeScript types  
✅ **Scalable** - Handles millions of requests  
✅ **Serverless** - No server management needed  
✅ **Edge Functions** - Global deployment for low latency  

## 🔑 Environment Variables

Set these in Convex dashboard:
- `OPENROUTER_API_KEY` - OpenRouter API key for AI
- `ELEVENLABS_API_KEY` - ElevenLabs API key for voice

## 📈 Monitoring

Monitor your Convex deployment:
```bash
npx convex logs      # View function logs
npx convex dashboard # Open dashboard
```

## 🎯 Next Steps

1. Run `npx convex dev` to configure
2. Deploy with `npx convex deploy --yes`  
3. Set environment variables
4. Update mobile app URL
5. Test voice features!

Your backend will be live at: `https://your-project.convex.cloud`