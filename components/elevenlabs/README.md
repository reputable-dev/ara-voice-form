# ElevenLabs UI Components for React Native

A complete React Native implementation of ElevenLabs UI components with integrated ScribeV2 Realtime transcription and conversational AI capabilities.

## 🎯 Overview

This library provides production-ready, voice-enabled UI components for building conversational AI applications in React Native. All components are designed to work seamlessly with:

- **ElevenLabs ScribeV2 Realtime** - Real-time speech-to-text via WebSocket
- **OpenRouter AI** - Conversational AI responses with streaming
- **React Native 0.81.5** - Cross-platform iOS & Android support
- **Expo SDK 54** - Modern React Native development

## 📦 Components

### Conversation Components

#### `<Conversation>`
Scrollable container for chat messages with auto-scroll and sticky-to-bottom behavior.

```tsx
import { Conversation } from '@/components/elevenlabs';

<Conversation autoScroll stickyToBottom>
  {messages.map(msg => (
    <Message key={msg.id} {...msg} />
  ))}
</Conversation>
```

**Props:**
- `autoScroll?: boolean` - Auto-scroll to bottom on new messages (default: `true`)
- `stickyToBottom?: boolean` - Stick to bottom when near end (default: `true`)
- `onScroll?: (event) => void` - Scroll event handler

---

#### `<ConversationBar>`
Input bar with text input and voice recording capabilities.

```tsx
import { ConversationBar } from '@/components/elevenlabs';

<ConversationBar
  onSendMessage={(text) => handleSendMessage(text)}
  onVoiceTranscription={(text) => handleVoiceInput(text)}
  placeholder="Type or hold mic to speak..."
  showWaveform={true}
/>
```

**Props:**
- `onSendMessage: (message: string) => void` - Called when user sends text message
- `onVoiceTranscription?: (text: string) => void` - Called when voice transcription completes
- `onRecordingStateChange?: (isRecording: boolean) => void` - Recording state changes
- `placeholder?: string` - Input placeholder text
- `disabled?: boolean` - Disable input
- `showWaveform?: boolean` - Show waveform during recording (default: `true`)

**Features:**
- Real-time voice transcription with ScribeV2 Realtime WebSocket
- Live waveform visualization during recording
- Press-and-hold mic button for voice input
- Automatic fallback to text-based transcription if WebSocket fails
- Pulse animation on recording button

---

#### `<Message>`
Individual message bubble for user/assistant messages.

```tsx
import { Message } from '@/components/elevenlabs';

<Message
  role="user"
  content="Hello, how are you?"
  timestamp={new Date()}
/>
```

**Props:**
- `role: 'user' | 'assistant' | 'system'` - Message sender role
- `content: string` - Message text
- `avatar?: string` - Avatar image URL
- `timestamp?: Date` - Message timestamp
- `isStreaming?: boolean` - Show streaming indicator

**Features:**
- Automatic styling based on role (user = blue, assistant = green)
- Avatar display with fallback to initials
- Timestamp formatting
- Streaming indicator for real-time responses

---

#### `<Response>`
Streaming markdown renderer with character-by-character animation.

```tsx
import { Response } from '@/components/elevenlabs';

<Response
  content={streamingText}
  isStreaming={true}
  streamSpeed={2}
  onStreamComplete={() => console.log('Done!')}
/>
```

**Props:**
- `content: string` - Text content to display
- `isStreaming?: boolean` - Enable streaming animation
- `streamSpeed?: number` - Characters per frame (default: `2`)
- `onStreamComplete?: () => void` - Called when streaming finishes

**Features:**
- Character-by-character streaming animation (~60fps)
- Blinking cursor during streaming
- Basic markdown support:
  - **Bold text** (`**text**`)
  - `Inline code` (`` `code` ``)
  - Code blocks (` ``` `)

---

### Voice Components

#### `<VoiceButton>`
Interactive voice recording button with waveform visualization.

```tsx
import { VoiceButton } from '@/components/elevenlabs';

<VoiceButton
  onTranscriptionComplete={(text) => handleTranscription(text)}
  size="large"
  showWaveform={true}
  showLabel={true}
/>
```

**Props:**
- `onTranscriptionComplete: (text: string) => void` - Called with final transcription
- `onRecordingStateChange?: (isRecording: boolean) => void` - Recording state changes
- `onTranscriptionStream?: (text: string) => void` - Partial transcription updates
- `size?: 'small' | 'medium' | 'large'` - Button size (default: `'medium'`)
- `showWaveform?: boolean` - Show waveform during recording (default: `true`)
- `showLabel?: boolean` - Show status label (default: `true`)
- `disabled?: boolean` - Disable button

**Features:**
- Press-and-hold to record, release to stop
- Real-time waveform visualization
- Pulse and glow animations during recording
- Partial transcription display
- Automatic WebSocket connection to ScribeV2 Realtime

**Sizes:**
- `small`: 60x60px button, 24px icon, 40px waveform
- `medium`: 80x80px button, 32px icon, 60px waveform
- `large`: 100x100px button, 40px icon, 80px waveform

---

### Audio Components

#### `<LiveWaveform>`
Real-time audio visualization with animated bars.

```tsx
import { LiveWaveform } from '@/components/elevenlabs';

<LiveWaveform
  audioLevel={0.7}
  isActive={true}
  barCount={20}
  barColor="#10B981"
/>
```

**Props:**
- `audioLevel: number` - Audio level (0.0 to 1.0)
- `isActive: boolean` - Enable visualization
- `barCount?: number` - Number of bars (default: `20`)
- `barColor?: string` - Bar color (default: Colors.light.tint)
- `barWidth?: number` - Bar width in pixels (default: `3`)
- `barGap?: number` - Gap between bars (default: `2`)
- `minHeight?: number` - Minimum bar height (default: `4`)
- `maxHeight?: number` - Maximum bar height (default: `40`)

**Features:**
- Animated bars based on audio level
- Staggered wave effect (20ms delay between bars)
- Idle pulse animation when active but no audio
- Smooth transitions with spring animations

---

#### `<BarVisualizer>`
Frequency-based audio visualizer with smoothing.

```tsx
import { BarVisualizer } from '@/components/elevenlabs';

<BarVisualizer
  frequencyData={audioFrequencyArray}
  isActive={true}
  barCount={32}
  smoothing={0.7}
/>
```

**Props:**
- `frequencyData?: number[]` - Frequency values (0-255) from audio analyzer
- `isActive: boolean` - Enable visualization
- `barCount?: number` - Number of bars (default: `32`)
- `barColor?: string` - Bar color
- `barWidth?: number` - Bar width (default: `4`)
- `barGap?: number` - Gap between bars (default: `2`)
- `minHeight?: number` - Minimum bar height (default: `2`)
- `maxHeight?: number` - Maximum bar height (default: `100`)
- `smoothing?: number` - Smoothing factor 0-1, higher = smoother (default: `0.7`)

**Features:**
- Frequency spectrum visualization
- Smoothing algorithm for fluid animations
- Idle pulse animation when no frequency data
- Spring animations for natural movement

---

#### `<TranscriptViewer>`
Word-by-word transcript highlighting synced to audio playback.

```tsx
import { TranscriptViewer, Word } from '@/components/elevenlabs';

const words: Word[] = [
  { text: 'Hello', startTime: 0, endTime: 0.5 },
  { text: 'world', startTime: 0.5, endTime: 1.0 },
];

<TranscriptViewer
  words={words}
  currentTime={audioPosition}
  onWordPress={(word, index) => seekTo(word.startTime)}
  autoScroll={true}
/>
```

**Props:**
- `words: Word[]` - Array of words with timing data
  - `Word: { text: string, startTime: number, endTime: number }`
- `currentTime: number` - Current playback position in seconds
- `onWordPress?: (word: Word, index: number) => void` - Called when word is tapped
- `highlightColor?: string` - Active word color (default: Colors.light.tint)
- `textColor?: string` - Default text color
- `fontSize?: number` - Font size in pixels (default: `16`)
- `lineHeight?: number` - Line height in pixels (default: `28`)
- `autoScroll?: boolean` - Auto-scroll to active word (default: `true`)

**Features:**
- Word-by-word highlighting synced to audio time
- Automatic scrolling to keep current word visible
- Tap any word to seek to that position
- Passed words fade to 50% opacity
- Active word gets bold weight and highlight color
- Smooth scroll animations

**Use Cases:**
- Podcast/audio transcriptions
- Language learning apps
- Accessibility features
- Karaoke-style lyrics display

---

#### `<AudioPlayer>`
Audio playback controller with progress tracking.

```tsx
import { AudioPlayer } from '@/components/elevenlabs';

<AudioPlayer
  audioUri="https://example.com/audio.mp3"
  onPlaybackUpdate={(positionMs, durationMs) => {
    setCurrentTime(positionMs / 1000);
  }}
  autoPlay={false}
  showControls={true}
/>
```

**Props:**
- `audioUri: string` - Audio file URI (local or remote)
- `onPlaybackUpdate?: (positionMillis: number, durationMillis: number) => void` - Playback position updates
- `onPlaybackStatusChange?: (isPlaying: boolean) => void` - Play/pause state changes
- `autoPlay?: boolean` - Auto-play on load (default: `false`)
- `showControls?: boolean` - Show control buttons (default: `true`)

**Features:**
- Play/pause controls
- Skip forward/backward (10 seconds)
- Progress bar with time display
- Background audio support (iOS)
- Automatic audio session management
- Error handling with user feedback

**Control Methods:**
The component uses `expo-av` for audio playback and exposes standard playback controls through the UI.

---

## 🚀 Conversational AI Service

### `ConversationalAI` Class

```tsx
import { createConversationalAI, SYSTEM_PROMPTS } from '@/lib/conversational-ai';

const ai = createConversationalAI({
  systemPrompt: SYSTEM_PROMPTS.voice_assistant,
  temperature: 0.7,
  maxTokens: 1000,
});

// Send message and get response
const response = await ai.sendMessage("Hello!");

// Streaming response
for await (const chunk of ai.streamMessage("Tell me a story")) {
  console.log(chunk); // Display each chunk as it arrives
}

// Get conversation history
const history = ai.getHistory();

// Clear history
ai.clearHistory();
```

**Methods:**
- `sendMessage(message: string): Promise<string>` - Send message, get full response
- `streamMessage(message: string): AsyncGenerator<string>` - Stream response chunk by chunk
- `getHistory(): Message[]` - Get conversation history
- `clearHistory(): void` - Clear conversation (keeps system prompt)
- `setSystemPrompt(prompt: string): void` - Update system prompt and reset

**Preset System Prompts:**
- `SYSTEM_PROMPTS.general` - General-purpose assistant
- `SYSTEM_PROMPTS.customer_support` - Customer service agent
- `SYSTEM_PROMPTS.creative_writing` - Writing assistant
- `SYSTEM_PROMPTS.code_helper` - Programming assistant
- `SYSTEM_PROMPTS.voice_assistant` - Voice-optimized responses

---

## 🎨 Complete Example

Full conversational AI chat interface with voice input:

```tsx
import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Conversation,
  ConversationBar,
  Message,
  Response,
} from '@/components/elevenlabs';
import { createConversationalAI } from '@/lib/conversational-ai';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const [isAIResponding, setIsAIResponding] = useState(false);

  const ai = createConversationalAI();

  const handleSendMessage = async (userMessage) => {
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }]);

    setIsAIResponding(true);

    // Stream AI response
    let fullResponse = '';
    for await (const chunk of ai.streamMessage(userMessage)) {
      fullResponse += chunk;
      setStreamingText(fullResponse);
    }

    // Add assistant message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: fullResponse,
      timestamp: new Date(),
    }]);

    setStreamingText('');
    setIsAIResponding(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Conversation>
        {messages.map(msg => (
          <Message key={msg.id} {...msg} />
        ))}

        {isAIResponding && streamingText && (
          <Response
            content={streamingText}
            isStreaming={true}
          />
        )}
      </Conversation>

      <ConversationBar
        onSendMessage={handleSendMessage}
        onVoiceTranscription={handleSendMessage}
        disabled={isAIResponding}
        showWaveform={true}
      />
    </KeyboardAvoidingView>
  );
}
```

---

## 🔧 Environment Variables

Required environment variables (add to `.env`):

```bash
# ElevenLabs API Key (for ScribeV2 Realtime transcription)
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key

# OpenRouter API Key (for conversational AI)
OPENROUTER_API_KEY=your_openrouter_api_key
```

Get your API keys:
- **ElevenLabs**: https://elevenlabs.io/app/profile
- **OpenRouter**: https://openrouter.ai/

---

## 🎯 Features

✅ **Real-time Voice Transcription** - ElevenLabs ScribeV2 Realtime with WebSocket
✅ **Conversational AI** - OpenRouter integration with streaming responses
✅ **Live Audio Visualization** - Waveforms and frequency visualizers
✅ **Streaming Markdown** - Character-by-character animation with code highlighting
✅ **Auto-scroll Chat** - Intelligent scroll behavior with sticky-to-bottom
✅ **Voice Input** - Press-and-hold recording with real-time feedback
✅ **Fallback Support** - Automatic fallback to file-based transcription
✅ **Cross-platform** - Works on iOS, Android, and Web

---

## 📱 Platform Notes

### iOS
- Microphone permission required (configured in `app.json`)
- Background audio mode enabled for continuous recording
- Hardware audio acceleration for optimal performance

### Android
- `RECORD_AUDIO` permission required (configured in `app.json`)
- Works with Android emulator and physical devices
- Tested on Android 10+

### Web
- Limited WebSocket support on some browsers
- Automatic fallback to file-based transcription
- Best tested in Chrome/Edge

---

## 🧪 Testing

All components include TypeScript types and can be tested with Jest + React Testing Library:

```bash
# Run component tests
bun run test elevenlabs

# Coverage report
bun run test:coverage
```

---

## 📄 License

MIT - Same as the main ARA Voice Form project

---

## 🙏 Credits

Components inspired by [elevenlabs/ui](https://github.com/elevenlabs/ui) but completely rewritten for React Native with enhanced voice and AI capabilities.
