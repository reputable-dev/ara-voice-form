import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Colors from '@/constants/colors';

export interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  avatar?: string;
  timestamp?: Date;
  isStreaming?: boolean;
}

export default function Message({
  role,
  content,
  avatar,
  timestamp,
  isStreaming = false,
}: MessageProps) {
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      {isAssistant && (
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.messageContent, isUser && styles.userMessage, isAssistant && styles.assistantMessage]}>
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {content}
        </Text>
        {isStreaming && (
          <View style={styles.streamingIndicator}>
            <View style={styles.streamingDot} />
          </View>
        )}
        {timestamp && (
          <Text style={styles.timestamp}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {isUser && (
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.userDefaultAvatar]}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  userContainer: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    marginTop: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  defaultAvatar: {
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDefaultAvatar: {
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 11,
    color: Colors.light.text,
    opacity: 0.5,
    marginTop: 4,
  },
  streamingIndicator: {
    marginTop: 8,
  },
  streamingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.tint,
  },
});
