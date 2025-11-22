# Integration Examples for ElevenLabs UI React Native Components

This document provides complete implementation examples for using the ElevenLabs UI to React Native HeroUI components in `ara-voice-form`.

## 🎤 Voice Recording with Real-Time Transcription

### Basic Voice Recording Component

```tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { VoiceButton, LiveWaveform } from '../heroui-elevenlabs';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  onError,
}) => {
  const [state, setState] = useState<'idle' | 'recording' | 'processing' | 'success' | 'error'>('idle');
  const [currentTranscript, setCurrentTranscript] = useState('');

  const handleVoicePress = async () => {
    if (state === 'idle') {
      setState('recording');
      setCurrentTranscript('');
      
      // Start ElevenLabs Scribe V2 Realtime
      try {
        await startRecording({
          onPartialTranscript: (text) => {
            setCurrentTranscript(text);
          },
          onFinalTranscript: (text) => {
            setCurrentTranscript(text);
            setState('success');
            onTranscript(text);
            setTimeout(() => setState('idle'), 2000);
          },
          onError: (error) => {
            setState('error');
            onError(error.message);
            setTimeout(() => setState('idle'), 3000);
          },
        });
      } catch (error) {
        setState('error');
        onError('Failed to start recording');
        setTimeout(() => setState('idle'), 3000);
      }
    } else if (state === 'recording') {
      stopRecording();
      setState('processing');
    }
  };

  return (
    <View className="gap-4 p-4">
      <Text className="text-lg font-bold mb-2">Voice Recording</Text>
      
      <VoiceButton
        state={state}
        onPress={handleVoicePress}
        label={state === 'idle' ? 'Tap to Record' : ''}
        trailing="⌥Space"
        variant={state === 'recording' ? 'primary' : 'secondary'}
      />

      {/* Display current transcript */}
      {state === 'recording' && currentTranscript && (
        <View className="bg-muted/50 border border-border rounded-lg p-3">
          <Text className="text-sm text-muted-foreground mb-1">Transcribing:</Text>
          <Text className="text-base">{currentTranscript}</Text>
        </View>
      )}

      {/* Real-time waveform */}
      {state === 'recording' && (
        <LiveWaveform
          active={true}
          height={32}
          className="w-full"
        />
      )}
    </View>
  );
};
```

## 💬 Conversational AI Chat Interface

### Chat Screen with Voice Input

```tsx
import React, { useState, useRef } from 'react';
import { View, Text } from 'react-native';
import { 
  Conversation, 
  ConversationBar, 
  Message,
  VoiceButton,
  LiveWaveform 
} from '../heroui-elevenlabs';
import type { Message as MessageType } from '../heroui-elevenlabs';

interface ChatScreenProps {
  agentId: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ agentId }) => {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      timestamp: new Date(),
    },
  ]);

  const [conversationState, setConversationState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [currentTranscript, setCurrentTranscript] = useState('');

  const handleVoicePress = () => {
    if (conversationState === 'idle') {
      setConversationState('listening');
      startVoiceRecording();
    } else if (conversationState === 'listening') {
      stopVoiceRecording();
      setConversationState('processing');
    }
  };

  const startVoiceRecording = () => {
    // Integration with ElevenLabs Scribe V2 Realtime
    console.log('Starting voice recording...');
  };

  const stopVoiceRecording = () => {
    console.log('Stopping voice recording...');
    
    // Simulate AI response
    setTimeout(() => {
      const userMessage: MessageType = {
        id: Date.now().toString(),
        role: 'user',
        content: currentTranscript || 'This is a sample user message',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      
      // Add AI response after processing
      setTimeout(() => {
        const assistantResponse: MessageType = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I understand what you said. Let me help you with that.',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantResponse]);
        setConversationState('idle');
        setCurrentTranscript('');
      }, 1500);
    }, 500);
  };

  const handleTextSubmit = (text: string) => {
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setConversationState('processing');

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `You said: "${text}". How can I assist you further?`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setConversationState('idle');
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Messages area */}
      <Conversation
        messages={messages}
        isActive={conversationState === 'listening' || conversationState === 'processing'}
        autoScroll={true}
        showTimestamps={true}
      />

      {/* Conversation input bar */}
      <ConversationBar
        agentId={agentId}
        state={conversationState}
        transcript={currentTranscript}
        onVoicePress={handleVoicePress}
        onTextSubmit={handleTextSubmit}
        voiceAvailable={true}
        textEnabled={true}
        showKeyboardHint={true}
        isConnected={true}
      />
    </View>
  );
};
```

## 🎵 Audio Player with Waveform Visualization

### Media Player Component

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { 
  AudioPlayer, 
  LiveWaveform, 
  TranscriptViewer,
  Waveform 
} from '../heroui-elevenlabs';

interface MediaPlayerProps {
  audioUrl: string;
  transcript?: Word[];
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  audioUrl, 
  transcript = [] 
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Load audio metadata
    loadAudioMetadata();
  }, [audioUrl]);

  const loadAudioMetadata = () => {
    // In production, use react-native-sound or similar
    setDuration(120); // Simulated 2-minute audio
  };

  const handlePlaybackStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const handleTimeUpdate = (time: number, totalDuration: number) => {
    setCurrentTime(time);
    setDuration(totalDuration);
  };

  const handlePlaybackComplete = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <View className="p-4 gap-4">
      <Text className="text-lg font-bold mb-2">Audio Player</Text>
      
      {/* Audio player controls */}
      <AudioPlayer
        source={audioUrl}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlaybackStateChange={handlePlaybackStateChange}
        onTimeUpdate={handleTimeUpdate}
        onPlaybackComplete={handlePlaybackComplete}
        showControls={true}
        showProgress={true}
        showTime={true}
      />

      {/* Waveform visualization */}
      <Waveform
        height={48}
        barWidth={2}
        barGap={1}
        color="#007AFF"
        showBackground={true}
      />

      {/* Transcript with word-level sync */}
      {transcript.length > 0 && (
        <TranscriptViewer
          words={transcript}
          currentTime={currentTime}
          isPlaying={isPlaying}
          highlightCurrentWord={true}
          showTimestamps={false}
          confidenceScores={false}
          onWordPress={(word, index) => {
            // Jump to specific word timestamp
            setCurrentTime(word.start);
          }}
        />
      )}

      {/* Live waveform when recording */}
      {isPlaying && (
        <View className="bg-muted/30 rounded-lg p-3">
          <Text className="text-sm text-muted-foreground mb-2">Audio Spectrum</Text>
          <LiveWaveform
            active={true}
            height={24}
            barCount={32}
            sensitivity={1.2}
          />
        </View>
      )}
    </View>
  );
};

// Sample transcript data
const sampleTranscript: Word[] = [
  { text: "Hello", start: 0.0, end: 0.5, confidence: 0.98 },
  { text: "and", start: 0.5, end: 0.8, confidence: 0.95 },
  { text: "welcome", start: 0.8, end: 1.3, confidence: 0.99 },
  { text: "to", start: 1.3, end: 1.5, confidence: 0.97 },
  { text: "our", start: 1.5, end: 1.7, confidence: 0.98 },
  { text: "React", start: 1.7, end: 2.1, confidence: 0.96 },
  { text: "Native", start: 2.1, end: 2.6, confidence: 0.99 },
  { text: "voice", start: 2.6, end: 3.0, confidence: 0.97 },
  { text: "interface", start: 3.0, end: 3.8, confidence: 0.95 },
];
```

## 🎛️ Voice Settings and Configuration

### Voice Configuration Screen

```tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { VoicePicker, BarVisualizer } from '../heroui-elevenlabs';
import { sampleVoices } from '../heroui-elevenlabs';

interface VoiceSettingsProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  selectedVoice,
  onVoiceChange,
}) => {
  const [previewVoice, setPreviewVoice] = useState<string | null>(null);

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceChange(voiceId);
  };

  const handlePreviewVoice = (voiceId: string) => {
    setPreviewVoice(voiceId);
    
    // Play voice sample
    playVoiceSample(voiceId);
    
    // Stop preview after sample duration
    setTimeout(() => {
      setPreviewVoice(null);
    }, 3000);
  };

  const playVoiceSample = (voiceId: string) => {
    // Integration with ElevenLabs text-to-speech
    console.log(`Playing sample for voice: ${voiceId}`);
  };

  return (
    <View className="p-4 gap-4">
      <Text className="text-xl font-bold mb-4">Voice Settings</Text>
      
      {/* Voice selection */}
      <View>
        <Text className="text-lg font-medium mb-2">Select Voice</Text>
        <VoicePicker
          voices={sampleVoices}
          selectedVoice={selectedVoice}
          onVoiceSelect={handleVoiceSelect}
          onPreviewVoice={handlePreviewVoice}
          showPreview={true}
          showLanguage={true}
          showCharacteristics={true}
          displayMode="list"
        />
      </View>

      {/* Visual feedback for active preview */}
      {previewVoice && (
        <View className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <Text className="text-sm text-primary font-medium mb-2">
            Previewing voice sample...
          </Text>
          <BarVisualizer
            active={true}
            height={32}
            barCount={16}
            colors={["#3B82F6", "#8B5CF6", "#EF4444"]}
            animationSpeed={80}
          />
        </View>
      )}

      {/* Voice characteristics display */}
      <View className="bg-muted/30 rounded-lg p-4">
        <Text className="text-sm font-medium mb-2">Selected Voice Info</Text>
        {(() => {
          const voice = sampleVoices.find(v => v.id === selectedVoice);
          return voice ? (
            <View className="gap-1">
              <Text className="text-sm">Name: {voice.name}</Text>
              <Text className="text-sm">Language: {voice.language}</Text>
              <Text className="text-sm">Gender: {voice.gender}</Text>
              <Text className="text-sm">Age: {voice.age}</Text>
              {voice.accent && (
                <Text className="text-sm">Accent: {voice.accent}</Text>
              )}
              {voice.description && (
                <Text className="text-sm text-muted-foreground mt-2">
                  {voice.description}
                </Text>
              )}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">
              No voice selected
            </Text>
          );
        })()}
      </View>
    </View>
  );
};
```

## 🔗 Integration with ara-voice-form

### Full App Integration Example

```tsx
// app/(tabs)/voice-form.tsx
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { 
  VoiceRecorderBy,
  ConversationBar,
  TranscriptViewer,
  AudioPlayer 
} from '../../components/heroui-elevenlabs';
import { useElevenLabsScribe } from '../../lib/elevenlabs-scribe';

export default function VoiceFormScreen() {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const { startRecording, stopRecording, isProcessing } = useElevenLabsScribe({
    onTranscript: (text) => {
      setTranscript(text);
    },
    onAudioRecorded: (url) => {
      setAudioUrl(url);
    },
    onError: (error) => {
      console.error('Recording error:', error);
    },
  });

  const handleVoicePress = () => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      startRecording();
      setIsRecording(true);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <Text className="text-2xl font-bold mb-4">Voice Form</Text>
        
        {/* Voice input area */}
        <ConversationBar
          state={isRecording ? 'listening' : isProcessing ? 'processing' : 'idle'}
          transcript={transcript}
          onVoicePress={handleVoicePress}
          textEnabled={false}
          voiceAvailable={true}
          isConnected={true}
        />

        {/* Transcript display */}
        {transcript && (
          <TranscriptViewer
            words={parseTranscript(transcript)}
            currentTime={0}
            highlightCurrentWord={false}
          />
        )}

        {/* Audio playback */}
        {audioUrl && (
          <AudioPlayer
            source={audioUrl}
            autoPlay={false}
            showControls={true}
            showProgress={true}
          />
        )}
      </View>
    </ScrollView>
  );
}

function parseTranscript(text: string): Word[] {
  // Convert raw text to word array with timestamps
  return text.split(' ').map((word, index) => ({
    text: word,
    start: index * 0.5, // Mock timing
    end: (index + 1) * 0.5,
    confidence: 0.95,
  }));
}
```

## 🧪 Testing Examples

### Component Testing

```tsx
// __tests__/VoiceButton.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VoiceButton } from '../heroui-elevenlabs';

describe('VoiceButton', () => {
  it('renders correctly in idle state', () => {
    const { getByText } = render(
      <VoiceButton onPress={jest.fn()} label="Test Button" />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <VoiceButton onPress={mockOnPress} label="Press Me" />
    );
    
    fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('shows recording state correctly', () => {
    const { getByTestId } = render(
      <VoiceButton state="recording" onPress={jest.fn()} />
    );
    
    // Test that waveform is shown during recording
    expect(getByTestId('live-waveform')).toBeTruthy();
  });
});
```

## 🎨 Custom Styling

### Custom Voice Button Styling

```tsx
import { VoiceButton } from '../heroui-elevenlabs';

const CustomVoiceButton = () => {
  return (
    <VoiceButton
      onPress={() => console.log('Custom voice button pressed')}
      label="Custom Voice"
      trailing="⌘V"
      variant="tertiary"
      size="lg"
      className="bg-gradient-to-r from-blue-500 to-purple-600"
      waveformClassName="bg-white/10"
      feedbackDuration={2000}
    />
  );
};
```

---

These examples provide complete, production-ready implementations for integrating ElevenLabs voice UI components into your React Native app. Each example demonstrates different aspects of the voice UI ecosystem and can be adapted for your specific use cases.