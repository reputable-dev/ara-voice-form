# Ask ARA — Knowledge Assistant

<div align="center">

![Ask ARA Logo](assets/images/icon.png)

**AI-Powered Voice Interaction for Form Filling & Contract Analysis**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Railway](https://img.shields.io/badge/Deployed%20on-Railway-0B0D17.svg)](https://railway.app/)

[📱 Download for iOS](https://apps.apple.com/app/ask-ara) • [📱 Download for Android](https://play.google.com/store/apps/ask-ara) • [🌐 Try Web Version](https://ask-ara.vercel.app)

</div>

## ✨ Overview

**Ask ARA** is a revolutionary mobile application that transforms how users interact with forms and contracts through advanced AI-powered voice technology. Built for professionals who need to quickly fill forms and analyze complex contract adjustments, the app combines real-time speech-to-text transcription with intelligent AI parsing to automate tedious data entry tasks.

### 🎯 Key Features

- **🎤 Voice Fill**: Speak naturally to fill contact forms instantly
- **📄 Contract Analysis**: Voice-powered contract adjustment forms with AI parsing
- **⚡ Real-Time Transcription**: Live speech-to-text using ElevenLabs ScribeV2
- **🤖 AI Form Extraction**: Intelligent field recognition and auto-population
- **📝 Voice Editing**: 2-second hold gesture for voice-based field editing
- **🔄 Cross-Platform**: Native iOS, Android, and Web support
- **🚀 Railway Deployed**: Production-ready backend infrastructure

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **Bun** runtime
- **Expo CLI**: `npm install -g @expo/cli`
- **Railway CLI** (for deployment): `npm install -g @railway/cli`

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ara-voice-form

# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# Required: OPENROUTER_API_KEY, ELEVENLABS_API_KEY
```

### Development

```bash
# Start backend server
bun run dev:backend

# Start Expo development server (in another terminal)
bun run start

# Or start web version for quick testing
bun run start-web
```

### Testing

```bash
# Run all tests
bun run test

# Run with coverage
bun run test:coverage

# Watch mode
bun run test:watch
```

## 📱 App Features

### 🎤 Voice Fill Screen

Transform spoken language into structured form data:

- **Natural Speech Input**: Speak conversationally about contact information
- **AI-Powered Parsing**: Automatically extracts name, email, phone, address, occupation
- **Real-Time Feedback**: See transcription and AI processing in real-time
- **Smart Validation**: Intelligent field recognition and formatting

**Example**: Say *"My name is John Doe, email john@example.com, phone 555-1234, I live at 123 Main Street, and I work as a software engineer"* → Form fills automatically!

### 📄 Contract Analysis Screen

Professional contract adjustment forms with voice assistance:

- **Complex Form Fields**: Client details, pricing, employee changes, subcontractor info
- **Voice Transcription**: Speak contract details for instant form population
- **AI Context Understanding**: Recognizes contract terminology and business logic
- **Tag-Based Selection**: Voice-activated toggles for contract types and options
- **Floating AI Assistant**: Context-aware help and form guidance

### 🎙️ Voice Technology Stack

- **Primary Engine**: ElevenLabs ScribeV2 Realtime (WebSocket streaming)
- **Fallback System**: ElevenLabs ScribeV2 API (file-based)
- **Connection Resilience**: Automatic reconnection with exponential backoff
- **Audio Quality**: 16kHz PCM, 16-bit, mono channel
- **Platform Support**: Native audio recording on mobile, WebRTC on web

### 🤖 AI Integration

- **Text Generation**: OpenRouter API with Claude-3-Haiku
- **Form Parsing**: Custom AI prompts for structured data extraction
- **Context Awareness**: Field-specific AI processing
- **Error Handling**: Graceful fallbacks and user feedback

## 🏗️ Architecture

### Frontend Architecture

```
📱 React Native + Expo Router
├── 🎨 UI Components (VoiceRecorder, VoiceEdit, InputField)
├── 📝 Screens (VoiceFill, ContractAnalysis, Dashboard)
├── 🔄 State Management (Zustand + React Query)
├── 🗣️ Voice Processing (ElevenLabs + WebSocket)
└── 🤖 AI Integration (OpenRouter API)
```

### Backend Architecture

```
🚀 Hono + tRPC Server
├── 🔐 API Proxy (OpenRouter secure proxy)
├── 📡 tRPC Routes (Type-safe API endpoints)
├── 🎯 CORS Configuration
└── 📊 Error Monitoring (Sentry)
```

### Key Components

#### VoiceRecorder Component
- Real-time WebSocket transcription
- Fallback to file-based API
- Connection state management
- Audio visualization with animations

#### VoiceEdit Component
- 2-second hold gesture detection
- Context-aware AI editing
- Smart command recognition ("clear", "change X to Y", "append")

#### ContractParser Utility
- AI-powered contract text analysis
- Structured data extraction
- Business logic validation

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Backend API URL (Railway deployment)
EXPO_PUBLIC_API_BASE_URL=https://your-railway-app.up.railway.app

# OpenRouter API Key (for AI text generation)
OPENROUTER_API_KEY=your_openrouter_api_key

# ElevenLabs API Key (for speech-to-text)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Optional: Sentry DSN for error monitoring
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Optional: OpenRouter referrer tracking
OPENROUTER_HTTP_REFERER=https://your-domain.com
OPENROUTER_X_TITLE=Ask ARA
```

### Railway Deployment

```bash
# Login to Railway
railway login

# Initialize project
railway init

# Deploy backend
railway up

# Set environment variables in Railway dashboard
# OPENROUTER_API_KEY, ELEVENLABS_API_KEY, etc.

# Get your deployment URL
railway domain
```

## 🧪 Testing Strategy

### Test Coverage: 60%+ Required

```bash
# Component Tests
components/__tests__/VoiceRecorder.test.tsx
components/__tests__/VoiceEdit.test.tsx
components/__tests__/InputField.test.tsx

# Screen Tests
app/__tests__/voice-fill-integration.test.tsx

# Utility Tests
utils/__tests__/contractParser.test.ts

# API Tests
lib/__tests__/trpc.test.ts
```

### Testing Features

- **Voice Recording Simulation**: Mocked audio recording and transcription
- **AI API Mocking**: Simulated OpenRouter responses
- **WebSocket Testing**: Connection state and message handling
- **Integration Tests**: End-to-end voice-to-form workflows

## 🚀 Deployment

### Mobile App Deployment

```bash
# Install EAS CLI
bun install -g @expo/eas-cli

# Configure for builds
eas build:configure

# Build for platforms
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Web Deployment

```bash
# Build for web
eas build --platform web

# Deploy options:
# - Vercel: Automatic from GitHub
# - Netlify: Connect repository
# - EAS Hosting: eas hosting:deploy
```

## 🔒 Security & Privacy

- **API Key Protection**: All AI API calls routed through secure backend proxy
- **No Client-Side Keys**: Sensitive credentials never exposed to mobile clients
- **CORS Protection**: Configured for app domain only
- **Error Sanitization**: Sensitive data filtered from error reports
- **Sentry Integration**: Production error monitoring and tracking

## 🎨 Design System

### Color Palette
- **Primary**: Emerald (#10B981) for AI features
- **Background**: Dark theme (#1A1A1A, #0B0B0B)
- **Text**: Light grays (#E5E7EB, #9CA3AF)
- **Accent**: Subtle borders and highlights

### Typography
- **System Fonts**: Platform-native for optimal performance
- **Sizes**: 12px-16px for readability
- **Weights**: 400-700 for hierarchy

### Voice UI Patterns
- **Recording States**: Visual feedback with pulsing animations
- **Connection Status**: Clear indicators for WebSocket state
- **Transcription Display**: Real-time text updates with AI badges

## 📊 Performance

### Benchmarks
- **Bun Runtime**: 5.6x faster than npm for installations
- **Voice Latency**: <500ms for real-time transcription
- **AI Processing**: <2 seconds for form field extraction
- **App Size**: Optimized bundles for mobile deployment

### Optimizations
- **WebSocket Streaming**: Reduces latency vs file uploads
- **Connection Pooling**: Efficient API call management
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Compressed assets and icons

## 🛠️ Development

### Code Quality

```bash
# Linting
bun run lint

# Type checking
npx tsc --noEmit

# Testing
bun run test:coverage
```

### Project Structure

```
ara-voice-form/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Voice Fill screen
│   │   ├── contract.tsx         # Contract Analysis
│   │   └── dashboard.tsx        # User dashboard
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable UI components
│   ├── VoiceRecorder.tsx        # Voice recording logic
│   ├── VoiceEdit.tsx           # Voice editing wrapper
│   ├── InputField.tsx          # Form input with voice
│   └── FloatingAIAssistant.tsx  # AI chat interface
├── backend/                      # Hono server
│   ├── hono.ts                 # Server setup
│   ├── api/gemini-proxy.ts     # OpenRouter proxy
│   └── trpc/                   # tRPC configuration
├── lib/                         # Shared utilities
│   ├── trpc.ts                 # Client configuration
│   └── sentry.ts               # Error monitoring
├── utils/                       # Helper functions
│   └── contractParser.ts       # Contract parsing logic
├── constants/                   # App constants
├── types/                       # TypeScript definitions
└── coverage/                    # Test coverage reports
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- **TypeScript Strict**: All code must pass strict type checking
- **Test Coverage**: Maintain 60%+ coverage for new features
- **Code Style**: Follow ESLint configuration
- **Voice UX**: Test all voice features on actual devices
- **Performance**: Profile and optimize before merging

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- **ElevenLabs** for ScribeV2 speech-to-text technology
- **OpenRouter** for AI model access
- **Expo** for the amazing React Native platform
- **Railway** for reliable deployment infrastructure
- **Rork** for the initial development framework

## 📞 Support

- **Documentation**: [docs/](docs/) folder
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: support@ask-ara.com

---

<div align="center">

**Built with ❤️ using React Native, Expo, and cutting-edge AI technology**

*Transforming voice into action, one form at a time.*

</div>