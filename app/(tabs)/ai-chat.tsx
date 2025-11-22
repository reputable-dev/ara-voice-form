import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  Conversation,
  ConversationBar,
  Message,
  Response,
  MessageProps,
} from '@/components/elevenlabs';
import { createConversationalAI, Message as AIMessage, SYSTEM_PROMPTS } from '@/lib/conversational-ai';
import Colors from '@/constants/colors';

interface DisplayMessage extends MessageProps {
  id: string;
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isAIResponding, setIsAIResponding] = useState<boolean>(false);

  const conversationalAI = useRef(
    createConversationalAI({
      systemPrompt: SYSTEM_PROMPTS.voice_assistant,
    })
  ).current;

  // Add welcome message on mount
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hi! I'm your AI assistant. You can type or use voice to chat with me. What can I help you with today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Add user message to display
    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAIResponding(true);
    setStreamingMessage('');

    try {
      // Get AI response with streaming
      let fullResponse = '';
      const stream = conversationalAI.streamMessage(userMessage);

      for await (const chunk of stream) {
        fullResponse += chunk;
        setStreamingMessage(fullResponse);
      }

      // Add assistant message to display
      const assistantMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingMessage('');
      setIsAIResponding(false);
    } catch (error) {
      console.error('Error getting AI response:', error);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
      setIsAIResponding(false);
      setStreamingMessage('');
    }
  };

  const handleVoiceTranscription = (text: string) => {
    // Voice transcription complete, send the message
    handleSendMessage(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Conversation autoScroll stickyToBottom>
        {messages.map((msg) => (
          <Message
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {/* Streaming response */}
        {isAIResponding && streamingMessage && (
          <View style={styles.streamingMessageContainer}>
            <View style={styles.avatarContainer}>
              <View style={styles.assistantAvatar}>
                <View style={styles.pulsingDot} />
              </View>
            </View>
            <View style={styles.streamingContent}>
              <Response
                content={streamingMessage}
                isStreaming={true}
                streamSpeed={2}
              />
            </View>
          </View>
        )}
      </Conversation>

      <ConversationBar
        onSendMessage={handleSendMessage}
        onVoiceTranscription={handleVoiceTranscription}
        placeholder="Type or hold mic to speak..."
        disabled={isAIResponding}
        showWaveform={true}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  streamingMessageContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginTop: 4,
  },
  assistantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  streamingContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
  },
});
