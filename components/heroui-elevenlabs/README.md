# ElevenLabs UI React Native HeroUI Components

🎤 **Production-ready React Native voice UI components** built with HeroUI v3, inspired by elevenlabs/ui but optimized for mobile.

## 🚀 Architecture

```
components/heroui-elevenlabs/
├── voice/                 # Voice recording & interaction
│   ├── VoiceButton.tsx   # Press-to-record button with waveform
│   └── VoicePicker.tsx   # Voice selection interface
├── audio/                 # Audio playback & visualization  
│   ├── AudioPlayer.tsx   # Audio playback controller
│   ├── LiveWaveform.tsx  # Real-time waveform visualizer
│   ├── Waveform.tsx      # Static waveform display
│   └── BarVisualizer.tsx # Frequency spectrum analyzer
├── conversation/          # Chat & messaging
│   ├── Conversation.tsx # Message container + scrolling
│   ├── ConversationBar.tsx # Voice + text input bar
│   ├── Message.tsx      # Role-based message bubbles
│   └── TranscriptViewer.tsx # Word-by-word sync
└── README_EXAMPLES.md    # Implementation examples
```

## 📱 Platform Compatibility

- ✅ **iOS** - Full voice recording & playback
- ✅ **Android** - Full voice recording & playback  
- ✅ **Web** - Limited audio (browser constraints)
- ✅ **Expo Go** - Development & testing
- ✅ **Production Builds** - App Store / Play Store ready

## 🎛️ Core Components

### Voice Recording
- **VoiceButton** - Press-to-record with real-time waveform
- **VoicePicker** - Multiple language/voice selection

### Audio Visualization
- **LiveWaveform** - Real-time animated waveform (20 bars)
- **Waveform** - Static waveform display from audio data
- **BarVisualizer** - Frequency spectrum with smoothing

### Conversation UI
- **Conversation** - Auto-scrolling message container
- **ConversationBar** - Voice + text input with ElevenLabs SDK
- **Message** - User/assistant/system message bubbles
- **TranscriptViewer** - Word-by-word audio sync

### Audio Playback
- **AudioPlayer** - React Native audio controller

## 🔧 Integration with ara-voice-form

These components are designed to seamlessly integrate with your existing:
- **ElevenLabs Scribe v2 Realtime** transcription
- **React state management** (Zustand + React Query)
- **Error monitoring** (Sentry)
- **Testing framework** (Jest + React Testing Library)

## 📦 Dependencies

**Required for React Native:**
```json
{
  "@heroui/react": "^3.0.0-beta.2",
  "react-native-web": "~0.19.10",
  "react-native-svg": "^15.0.0",
  "@react-native-community/netinfo": "^11.0.0"
}
```

**Already installed in ara-voice-form:**
- ✅ React Native 0.81.5 + Expo SDK 54
- ✅ ElevenLabs SDK integration
- ✅ WebSocket transcription service

## 🧪 Testing Strategy

- ✅ **Unit tests** for all components (`__tests__/`)
- ✅ **Integration tests** for voice flows
- ✅ **Mobile mocking** for audio APIs
- ✅ **Platform-specific** testing (iOS/Android)

## 🎯 Key Differences from elevenlabs/ui

| Feature | ElevenLabs UI (Web) | HeroUI React Native (Mobile) |
|---------|-------------------|-----------------------------|
| **Audio** | Web Audio API | React Native AudioRecord |
| **WebSocket** | Browser WS | React Native WebSocket |
| **Styling** | Tailwind CSS | HeroUI + StyleSheet |
| **Platform** | Desktop/Mobile | Native iOS/Android |
| **Touch** | Mouse + Touch | Touch-optimized gestures |
| **Performance** | Web optimized | Native performance |

## 📖 Usage Examples

See `README_EXAMPLES.md` for complete implementation examples including:
- Voice recording with real-time transcription
- Conversational AI chat interfaces
- Audio playback controls with waveform visualization
- Integration with ElevenLabs agents

## 🏗️ Migration Status

✅ **Completed:**
- VoiceButton → HeroUI Button + React Native audio
- LiveWaveform → React Native SVG animation
- Conversation → React Native ScrollView integration

🔄 **In Progress:**
- ConversationBar SDK integration
- AudioPlayer React Native setup
- TranscriptViewer audio sync

📋 **Planned:**
- VoicePicker component
- BarVisualizer frequency analysis
- Additional conversation features

---

**Built with ❤️ for ara-voice-form React Native app**