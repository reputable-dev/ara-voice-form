# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ask ARA — Knowledge Assistant** is a native cross-platform mobile app built with Rork, featuring AI-powered voice interaction for form filling and contract analysis.

**Key Technologies:**
- **Frontend:** React Native 0.81.5 + Expo SDK 54 + Expo Router (file-based routing)
- **Backend:** Hono + tRPC for type-safe API
- **Voice AI:** ElevenLabs ScribeV2 Realtime (speech-to-text with WebSocket streaming)
- **Text AI:** OpenRouter API (via @rork-ai/toolkit-sdk)
- **State Management:** Zustand + React Query (@tanstack/react-query)
- **Testing:** Jest + React Testing Library (60% coverage threshold)
- **Error Monitoring:** Sentry for production error tracking
- **Runtime:** Bun 1.3.0 (5.6x faster than npm)

## Development Commands

### Package Management
```bash
# Install dependencies (preferred - use Bun)
bun install

# Start development server with Rork tunnel
bun run start

# Start with web preview (recommended for quick testing)
bun run start-web

# Start with web preview + debug logs
bun run start-web-dev
```

### Testing
```bash
# Run all tests
bun run test

# Watch mode (auto-rerun on changes)
bun run test:watch

# Coverage report (60% threshold required)
bun run test:coverage

# CI mode (for GitHub Actions)
bun run test:ci
```

### Platform-Specific Development
```bash
# iOS (requires Xcode)
bun run ios

# Android (requires Android Studio)
bun run android

# Lint code
bun run lint
```

### Building for Production
```bash
# Install EAS CLI globally
bun install -g @expo/eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for web
eas build --platform web

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## Architecture & Code Organization

### Directory Structure

```
ara-voice-form/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── index.tsx            # Home screen
│   │   ├── dashboard.tsx        # User dashboard
│   │   ├── contract.tsx         # Contract analysis screen
│   │   └── _layout.tsx          # Tab layout configuration
│   ├── _layout.tsx              # Root layout (providers setup)
│   ├── modal.tsx                # Example modal screen
│   └── __tests__/               # Screen integration tests
├── components/                   # Reusable UI components
│   ├── VoiceRecorder.tsx        # Voice recording with real-time STT
│   ├── VoiceEdit.tsx            # 2-second hold voice editing
│   ├── VoiceEditModal.tsx       # Voice edit UI modal
│   ├── FloatingAIAssistant.tsx  # Floating AI chat interface
│   ├── FloatingAINavbar.tsx     # Global AI navigation bar
│   ├── InputField.tsx           # Form input with voice edit
│   ├── Card.tsx                 # UI card component
│   ├── TagToggle.tsx            # Tag selection component
│   ├── ErrorBoundary.tsx        # Error boundary wrapper
│   ├── elevenlabs/              # ElevenLabs UI components (NEW)
│   │   ├── conversation/        # Chat/conversation components
│   │   │   ├── Conversation.tsx # Scrollable message container
│   │   │   ├── ConversationBar.tsx # Voice + text input bar
│   │   │   ├── Message.tsx      # Individual message bubble
│   │   │   └── Response.tsx     # Streaming markdown renderer
│   │   ├── voice/               # Voice interaction components
│   │   │   └── VoiceButton.tsx  # Press-hold voice recording button
│   │   ├── audio/               # Audio visualization components
│   │   │   ├── LiveWaveform.tsx # Real-time waveform visualizer
│   │   │   ├── BarVisualizer.tsx # Frequency spectrum visualizer
│   │   │   ├── TranscriptViewer.tsx # Word-by-word transcript sync
│   │   │   └── AudioPlayer.tsx  # Audio playback controller
│   │   ├── index.ts             # Component exports
│   │   └── README.md            # Complete documentation
│   └── __tests__/               # Component unit tests
├── convex/                       # Convex backend functions (NEW)
│   ├── api.ts                   # OpenRouter & ElevenLabs integrations
│   ├── geminiRag.ts             # Gemini RAG proxy functions (NEW)
│   ├── schema.ts                # Database schema
│   └── _generated/              # Auto-generated types
├── services/                     # External services (NEW)
│   └── gemini_rag/              # Gemini RAG service directory
│       ├── Dockerfile           # Container definition
│       ├── .dockerignore        # Docker build exclusions
│       └── .env.example         # Environment template
├── backend/                      # Backend API logic
│   ├── hono.ts                  # Hono server setup
│   ├── api/gemini-proxy.ts      # Gemini API proxy
│   └── trpc/                    # tRPC router configuration
│       ├── app-router.ts        # Main tRPC router
│       ├── create-context.ts    # tRPC context factory
│       └── routes/              # tRPC route handlers
├── lib/                          # Shared utilities
│   ├── trpc.ts                  # Convex client setup
│   ├── sentry.ts                # Sentry error tracking
│   ├── conversational-ai.ts     # Conversational AI service (NEW)
│   ├── gemini-rag.ts            # Gemini RAG hooks (NEW)
│   └── convex-helpers.ts        # Convex type-safe helpers (NEW)
├── utils/                        # Helper functions
│   └── contractParser.ts        # Contract parsing utilities
├── constants/                    # App-wide constants
│   └── colors.ts                # Color definitions
├── types/                        # TypeScript type definitions
├── coverage/                     # Test coverage reports
└── docs/                         # Documentation
```

### Critical Architecture Patterns

#### 1. Voice Recording with Real-Time Transcription

The app uses **two-tier transcription strategy**:

**Primary: ElevenLabs ScribeV2 Realtime (WebSocket)**
- Real-time streaming transcription with `react-native-audio-record`
- 16kHz PCM audio, 16-bit, mono channel
- Handles partial and committed transcripts
- Connection resilience: automatic reconnection with exponential backoff (max 3 attempts)
- Heartbeat mechanism to keep WebSocket alive (30-second intervals)

**Fallback: ElevenLabs ScribeV2 API (File-based)**
- Used when WebSocket connection fails
- File-based transcription via HTTP POST
- Handles network failures gracefully

**Key files:**
- `components/VoiceRecorder.tsx:105-188` - WebSocket connection logic
- `components/VoiceRecorder.tsx:279-346` - Recording start with fallback
- `components/VoiceRecorder.tsx:407-495` - Recording stop with commit

#### 2. ElevenLabs UI Components (NEW)

The app now includes a complete suite of **production-ready conversational AI components** inspired by elevenlabs/ui but built specifically for React Native:

**Conversation Components:**
- `<Conversation>` - Auto-scrolling message container with sticky-to-bottom behavior
- `<ConversationBar>` - Input bar with voice recording (ScribeV2 Realtime) + text input
- `<Message>` - Role-based message bubbles (user/assistant/system) with avatars
- `<Response>` - Streaming markdown renderer with character-by-character animation

**Voice Components:**
- `<VoiceButton>` - Press-and-hold voice recording with waveform visualization

**Audio Visualization:**
- `<LiveWaveform>` - Real-time animated waveform (20 bars with stagger effect)
- `<BarVisualizer>` - Frequency spectrum visualizer with smoothing
- `<TranscriptViewer>` - Word-by-word transcript highlighting synced to audio playback
- `<AudioPlayer>` - Audio playback controller with progress and controls

**Conversational AI Service:**
```typescript
import { createConversationalAI, SYSTEM_PROMPTS } from '@/lib/conversational-ai';

const ai = createConversationalAI({
  systemPrompt: SYSTEM_PROMPTS.voice_assistant,
});

// Send message with streaming
for await (const chunk of ai.streamMessage("Hello!")) {
  console.log(chunk); // Display each chunk
}
```

**Example Implementation:**
See `app/(tabs)/ai-chat.tsx` for a complete working example of a conversational AI chat interface with voice input and streaming responses.

**Documentation:**
- Full component API: `components/elevenlabs/README.md`
- Example usage: `app/(tabs)/ai-chat.tsx`

**Key files:**
- `components/elevenlabs/conversation/ConversationBar.tsx:105-195` - Voice input integration
- `components/elevenlabs/conversation/Response.tsx:35-74` - Streaming animation
- `lib/conversational-ai.ts:27-99` - AI service implementation

#### 3. Gemini RAG Integration (NEW)

The app integrates **Google Gemini RAG** (Retrieval-Augmented Generation) for file search and knowledge base querying:

**Backend Proxy (Convex):**
- `convex/geminiRag.ts` - Convex mutations/queries that proxy to the RAG service
- Runs on `http://localhost:5001` (configurable via `RAG_SERVICE_URL`)
- Based on [gemini-rag-file-search](https://github.com/promptadvisers/gemini-rag-file-search)

**Frontend React Hooks:**
```typescript
import { useQueryRag, useListRagFiles, useRagStatus } from '@/lib/gemini-rag';

// Query RAG
const { query } = useQueryRag();
const result = await query("What is in document X?", "my_store");

// List files
const { files, totalFiles, isOnline } = useListRagFiles("my_store");

// Check status
const { status, isOnline } = useRagStatus();
```

**Available Operations:**
- `uploadFile()` - Upload files for indexing (base64 encoded)
- `query()` - Ask questions about indexed files
- `listFiles()` - List all files in a store
- `deleteFile()` - Remove file from index
- `clearStore()` - Delete all files in a store
- `getStatus()` - Check RAG service health

**Setup & Deployment:**

**Option 1: Local Development (Bash Script)**
```bash
# Run integration script
./integrate_gemini_rag.sh

# Service will start on http://localhost:5001
# Status: curl http://localhost:5001/status
# Stop: kill $(cat services/gemini_rag/rag.pid)
```

**Option 2: Docker Deployment**
```bash
# Build and start with Docker Compose
docker-compose up -d gemini-rag

# Check logs
docker-compose logs -f gemini-rag

# Stop service
docker-compose down
```

**Demo Screen:**
- `app/(tabs)/rag-demo.tsx` - Complete RAG interface with query, file management, and status monitoring

**Key files:**
- `convex/geminiRag.ts` - Backend proxy functions
- `lib/gemini-rag.ts` - React hooks for RAG operations
- `integrate_gemini_rag.sh` - Integration script
- `docker-compose.yml` - Docker orchestration
- `services/gemini_rag/Dockerfile` - Container definition

**Configuration:**
- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `RAG_SERVICE_URL` - RAG service URL (default: `http://localhost:5001`)
- `RAG_STORE_NAME` - Default store name (default: `default_store`)
- `RAG_CORS_ORIGINS` - Allowed CORS origins

#### 4. Voice Edit Feature (2-Second Hold)

Users can edit any input field by holding for 2 seconds:

**Flow:**
1. User holds on input field (2 seconds triggers)
2. Blur effect + modal appear
3. Voice recording starts automatically
4. Real-time transcription displayed
5. AI processes edit instruction with context
6. Field updates intelligently (replace/append/clear)

**Smart Edit Logic:**
- Uses `@rork-ai/toolkit-sdk` for context-aware editing
- Understands commands: "clear", "change X to Y", "append", etc.
- Maintains field context for intelligent updates

**Key files:**
- `components/VoiceEdit.tsx:138-169` - Recording initialization
- `components/VoiceEdit.tsx:502-530` - Smart edit processing with AI
- `components/VoiceEdit.tsx:539-583` - 2-second hold detection

#### 4. tRPC + React Query Integration

Type-safe API calls with automatic caching and invalidation:

**Backend:**
```typescript
// backend/trpc/routes/example/hi/route.ts
export default publicProcedure.query(() => {
  return { message: "Hello from tRPC!" };
});
```

**Frontend:**
```typescript
// In any component
const { data } = trpc.example.hi.useQuery();
```

**Key files:**
- `backend/trpc/app-router.ts` - Main router definition
- `lib/trpc.ts` - Client configuration with React Query
- `app/_layout.tsx:40-48` - Provider setup

#### 5. Error Monitoring with Sentry

Production error tracking with automatic breadcrumbs:

**Initialization:**
- Configured in `app/_layout.tsx:13` (called on app start)
- Filters sensitive data (API keys, tokens, auth headers)
- Tracks navigation, performance, and user interactions

**Usage:**
```typescript
import { captureException, addBreadcrumb } from '@/lib/sentry';

try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    context: 'operationName',
    fieldName: 'value',
  });
}
```

**Key files:**
- `lib/sentry.ts` - Full Sentry configuration and helpers
- `components/VoiceEdit.tsx:161-166` - Error tracking example

## Environment Variables

**Required Variables (.env file):**

```bash
# tRPC Backend URL
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000

# OpenRouter API Key (AI text generation)
OPENROUTER_API_KEY=your_openrouter_api_key

# ElevenLabs API Key (speech-to-text)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key  # For client-side ScribeV2

# Google Gemini API Key (RAG file search - NEW)
GEMINI_API_KEY=your_gemini_api_key

# RAG Service Configuration (NEW)
RAG_SERVICE_URL=http://localhost:5001
RAG_STORE_NAME=default_store
RAG_CORS_ORIGINS=http://localhost:3000,http://localhost:5001
GEMINI_MODEL=gemini-2.5-pro

# Convex Backend (NEW)
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Sentry DSN (error monitoring - optional in dev)
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

**Setup:**
```bash
# Copy template and fill in values
cp .env.example .env
# Edit .env with your actual API keys
```

**Security:**
- NEVER commit `.env` files (already in `.gitignore`)
- Use different keys for dev/staging/production
- For production builds, set env vars in EAS build profiles (eas.json)

## Testing Strategy

### Coverage Requirements
- **Global threshold:** 60% statements, 50% branches, 60% functions, 60% lines
- **Enforced in CI:** Tests fail if coverage drops below threshold

### Test File Locations
- Component tests: `components/__tests__/ComponentName.test.tsx`
- Screen tests: `app/__tests__/screen-name.test.tsx`
- Utility tests: `utils/__tests__/utilityName.test.ts`

### Running Specific Tests
```bash
# Run single test file
bun run test VoiceRecorder.test.tsx

# Run tests matching pattern
bun run test --testNamePattern="voice"

# Update snapshots
bun run test -u
```

### Test Patterns Used
- **React Testing Library:** `render`, `fireEvent`, `waitFor`
- **Jest mocks:** Mocking Expo modules, WebSocket, audio APIs
- **Integration tests:** Full user flows (voice recording → transcription → field update)

**Key test files:**
- `components/__tests__/VoiceRecorder.test.tsx` - Voice recording logic
- `app/__tests__/voice-fill-integration.test.tsx` - End-to-end voice flow

## Common Development Tasks

### Adding a New Screen with Voice Input
1. Create file in `app/(tabs)/new-screen.tsx`
2. Import `VoiceEdit` wrapper for voice-enabled inputs
3. Add route to tab navigator in `app/(tabs)/_layout.tsx`
4. Create test file in `app/(tabs)/__tests__/new-screen.test.tsx`

### Adding a New tRPC Endpoint
1. Create route file in `backend/trpc/routes/category/action/route.ts`
2. Export procedure (publicProcedure or authenticatedProcedure)
3. Import and add to router in `backend/trpc/app-router.ts`
4. Use in frontend: `trpc.category.action.useQuery()` or `.useMutation()`

### Debugging Voice Recording Issues
1. Check WebSocket connection state in logs: "WebSocket connected to ElevenLabs"
2. Verify API key: `EXPO_PUBLIC_ELEVENLABS_API_KEY` in .env
3. Test fallback: Trigger connection timeout to use file-based API
4. Check audio permissions: iOS requires microphone permission in Info.plist

### Troubleshooting Common Errors

**"WebSocket connection timeout"**
- Check internet connection
- Verify ElevenLabs API key is valid
- App falls back to file-based transcription automatically

**"No API key configured"**
- Missing environment variable in .env
- Restart development server after adding .env variables

**"Test coverage below threshold"**
- Run `bun run test:coverage` to see which files need tests
- Add tests to `__tests__/` directories
- Aim for 60%+ coverage on new code

## Platform-Specific Notes

### iOS Development
- Requires Xcode installed
- Microphone permission configured in `app.json:19-26` (Info.plist)
- Background audio mode enabled for voice recording
- Test on iOS Simulator: `bun run start` then press "i"

### Android Development
- Requires Android Studio + emulator
- Permissions: CAMERA, STORAGE, RECORD_AUDIO in `app.json:34-39`
- Test on Android Emulator: `bun run start` then press "a"

### Web Development
- Limited native features (no native audio recording)
- Use `bun run start-web` for quick UI testing
- Some components have Platform.OS checks for web compatibility

## Performance Considerations

### Bun Runtime Benefits
- **5.6x faster** dependency installation vs npm
- **2.8x faster** builds vs npm
- Native TypeScript support (no transpilation needed)

### Voice Recording Optimization
- WebSocket streaming reduces latency vs file uploads
- Heartbeat mechanism prevents connection drops
- Exponential backoff for reconnections (prevents spam)
- Automatic fallback ensures reliability

### React Query Caching
- tRPC queries cached automatically
- Stale time configurable per query
- Background refetching for fresh data
- Optimistic updates for mutations

## Deployment

### App Store / Google Play
```bash
# Configure EAS project
eas build:configure

# Build production binaries
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Web Deployment
```bash
# Build for web
eas build --platform web

# Deploy to EAS Hosting
eas hosting:configure
eas hosting:deploy

# Alternative: Deploy to Vercel/Netlify via GitHub
```

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** (`tsconfig.json`)
- Always use explicit types for function parameters
- Use `interface` for component props
- Use `type` for utility types

### React Native
- Prefer `StyleSheet.create()` over inline styles
- Use `Platform.OS` checks for platform-specific code
- Avoid `any` type - use proper TypeScript types

### Testing
- Write tests before fixing bugs (TDD approach)
- Test user interactions, not implementation details
- Mock external APIs and native modules
- Aim for 60%+ coverage on new features

## File Naming Conventions

- **Components:** PascalCase (e.g., `VoiceRecorder.tsx`)
- **Screens:** kebab-case or camelCase (e.g., `dashboard.tsx`)
- **Utilities:** camelCase (e.g., `contractParser.ts`)
- **Test files:** Same name + `.test.tsx` (e.g., `VoiceRecorder.test.tsx`)
- **Type definitions:** PascalCase + `Types` suffix (optional)

## Important Implementation Details

### Voice Recording State Machine
The `VoiceRecorder` component maintains several connection states:
- `disconnected` → WebSocket not connected
- `connecting` → Attempting to connect
- `connected` → Real-time streaming active
- `error` → Connection failed (triggers fallback)

Always handle all states in UI to provide user feedback.

### Smart Edit Context Awareness
When processing voice edits, the AI receives:
1. Current field value
2. User's spoken instruction
3. Field name for semantic context

This enables commands like:
- "clear" → Empty the field
- "change X to Y" → Find and replace
- "append Z" → Add to existing content

### tRPC Type Safety
The tRPC router exports `AppRouter` type, which provides:
- Autocomplete for all endpoints
- Type inference for request/response
- Compile-time validation of API calls

Never bypass types with `as any` - use proper type definitions.

## Security Considerations

### API Key Management
- All API keys in `.env` file (not tracked in git)
- Use `EXPO_PUBLIC_*` prefix ONLY for client-safe values
- Server-only keys: OPENROUTER_API_KEY, ELEVENLABS_API_KEY (no prefix)
- Rotate keys after any suspected exposure

### Sentry Data Filtering
- Automatically filters: authorization headers, cookies, API keys
- Custom filtering in `lib/sentry.ts:56-82`
- Review breadcrumbs before production release

### User Input Validation
- Always validate user input on server (tRPC procedures)
- Use Zod schemas for runtime validation
- Sanitize data before AI processing

## Project Context

This app was built with **Rork** (rork.com), which provides:
- AI-assisted development workflow
- Automatic GitHub sync
- Pre-configured Expo + React Native setup
- Built-in tunnel for mobile device testing

The codebase follows Rork best practices and is designed for rapid iteration with AI assistance.
