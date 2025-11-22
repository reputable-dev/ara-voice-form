// ElevenLabs UI React Native HeroUI Components
// Production-ready voice UI components for React Native built with HeroUI v3

// Voice Components
export { VoiceButton, BasicVoiceButton, VoiceButtonExample } from './voice/VoiceButton';
export type { VoiceButtonProps } from './voice/VoiceButton';

export { VoicePicker, sampleVoices } from './voice/VoicePicker';
export type { VoicePickerProps, VoiceOption } from './voice/VoicePicker';

// Audio Components  
export { LiveWaveform, StaticWaveform } from './audio/LiveWaveform';
export type { LiveWaveformProps, StaticWaveformProps } from './audio/LiveWaveform';

export { AudioPlayer, SimpleAudioPlayer } from './audio/AudioPlayer';
export type { AudioPlayerProps, SimplePlayerProps } from './audio/AudioPlayer';

export { Waveform, DefaultWaveform, FrequencySpectrum, RadialWaveform } from './audio/Waveform';
export type { WaveformProps, SpectrumProps, RadialWaveformProps } from './audio/Waveform';

export { BarVisualizer, AnimatedBarVisualizer, MinimalVisualizer } from './audio/BarVisualizer';
export type { BarVisualizerProps, AnimatedBarVisualizerProps, MinimalVisualizerProps } from './audio/BarVisualizer';

export { TranscriptViewer, SimpleTranscript, ParagraphTranscript } from './audio/TranscriptViewer';
export type { TranscriptViewerProps, SimpleTranscriptProps, ParagraphTranscriptProps, Word, Paragraph } from './audio/TranscriptViewer';

// Conversation Components
export { Conversation } from './conversation/Conversation';
export type { ConversationProps } from './conversation/Conversation';

export { ConversationBar, SimpleConversationBar } from './conversation/ConversationBar';
export type { ConversationBarProps, SimpleConversationBarProps } from './conversation/ConversationBar';

export { Message as MessageComponent, StreamingMessage, TypingIndicator, SystemMessage } from './conversation/Message';
export type { MessageProps, StreamingMessageProps, TypingIndicatorProps, SystemMessageProps } from './conversation/Message';

// Re-export Message type from Conversation for convenience
export type { Message } from './conversation/Conversation';

// Default exports for easier tree shaking
export default {
  // Voice
  VoiceButton,
  VoicePicker,
  
  // Audio
  LiveWaveform,
  AudioPlayer, 
  Waveform,
  BarVisualizer,
  TranscriptViewer,
  
  // Conversation
  Conversation,
  ConversationBar,
  MessageComponent,
};