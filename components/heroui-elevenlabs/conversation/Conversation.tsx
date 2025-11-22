"use client";

import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Card } from "@heroui/react";

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp?: Date;
  isTyping?: boolean;
}

export interface ConversationProps {
  /**
   * Array of messages in the conversation
   */
  messages: Message[];

  /**
   * Whether the conversation is currently active
   * @default false
   */
  isActive?: boolean;

  /**
   * Whether to show timestamps
   * @default false
   */
  showTimestamps?: boolean;

  /**
   * Whether to auto-scroll to bottom on new messages
   * @default true
   */
  autoScroll?: boolean;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Callback when message is pressed
   */
  onMessagePress?: (message: Message) => void;

  /**
   * Maximum number of messages to keep in memory
   */
  maxMessages?: number;

  /**
   * Whether to show avatars
   * @default true
   */
  showAvatars?: boolean;

  /**
   * User avatar component or text
   */
  userAvatar?: React.ReactNode;

  /**
   * Assistant avatar component or text
   */
  assistantAvatar?: React.ReactNode;

  /**
   * Custom message render function
   */
  renderMessage?: (message: Message, index: number) => React.ReactNode;
}

export const Conversation: React.FC<ConversationProps> = ({
  messages,
  isActive = false,
  showTimestamps = false,
  autoScroll = true,
  className = "",
  onMessagePress,
  maxMessages,
  showAvatars = true,
  userAvatar = "👤",
  assistantAvatar = "🤖",
  renderMessage,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, autoScroll]);

  // Limit messages if maxMessages is set
  const displayMessages = maxMessages && maxMessages > 0 
    ? messages.slice(-maxMessages)
    : messages;

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageColor = (role: MessageRole) => {
    switch (role) {
      case "user":
        return "bg-primary/10 border-primary/20";
      case "assistant":
        return "bg-secondary/10 border-secondary/20";
      case "system":
        return "bg-muted border-border";
      default:
        return "bg-background border-border";
    }
  };

  const getMessageAlignment = (role: MessageRole) => {
    switch (role) {
      case "user":
        return "items-end";
      case "assistant":
        return "items-start";
      case "system":
        return "items-center";
      default:
        return "items-start";
    }
  };

  const getAvatar = (role: MessageRole) => {
    switch (role) {
      case "user":
        return userAvatar;
      case "assistant":
        return assistantAvatar;
      case "system":
        return "ℹ️";
      default:
        return assistantAvatar;
    }
  };

  const DefaultMessage: React.FC<{ message: Message; index: number }> = ({ 
    message, 
    index 
  }) => {
    const messageColor = getMessageColor(message.role);
    const alignment = getMessageAlignment(message.role);
    const avatar = getAvatar(message.role);

    return (
      <View 
        key={message.id} 
        className={`w-full py-2 px-4 ${alignment}`}
      >
        <View className={`max-w-[80%] flex-row gap-2 ${alignment}`}>
          {/* Avatar */}
          {showAvatars && (
            <View className="w-6 h-6 rounded-full bg-muted items-center justify-center flex-shrink-0">
              <Text className="text-xs">{avatar}</Text>
            </View>
          )}

          {/* Message content */}
          <View className={`flex-1 ${messageColor} border rounded-lg p-3`}>
            <Text className="text-foreground text-sm leading-relaxed">
              {message.content}
            </Text>
            
            {/* Timestamp */}
            {showTimestamps && message.timestamp && (
              <Text className="text-muted-foreground text-xs mt-1">
                {formatTime(message.timestamp)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      className={`flex-1 bg-background ${className}`}
      style={styles.scrollView}
      onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
      onContentSizeChange={(width, height) => setContentHeight(height)}
      showsVerticalScrollIndicator={false}
    >
      {displayMessages.length === 0 ? (
        <View className="flex-1 items-center justify-center py-12">
          <Text className="text-muted-foreground text-center px-4">
            No messages yet. Start a conversation!
          </Text>
        </View>
      ) : (
        <View className="flex-1 py-4">
          {displayMessages.map((message, index) => {
            if (renderMessage) {
              return renderMessage(message, index);
            }
            return <DefaultMessage key={message.id} message={message} index={index} />;
          })}
        </View>
      )}

      {/* Typing indicator */}
      {isActive && (
        <View className="items-start py-2 px-4">
          <View className={`max-w-[80%] flex-row gap-2 items-start`}>
            {showAvatars && (
              <View className="w-6 h-6 rounded-full bg-muted items-center justify-center flex-shrink-0">
                <Text className="text-xs">{assistantAvatar}</Text>
              </View>
            )}
            <View className="bg-secondary/10 border-secondary/20 border rounded-lg p-3">
              <Text className="text-muted-foreground text-sm">
                <Text className="animate-pulse">●</Text>
                <Text className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</Text>
                <Text className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</Text>
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// Individual message component for standalone use
export interface MessageProps {
  message: Message;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  avatar?: React.ReactNode;
  alignment?: "start" | "end" | "center";
  onPress?: (message: Message) => void;
  className?: string;
}

export const MessageComponent: React.FC<MessageProps> = ({
  message,
  showAvatar = true,
  showTimestamp = false,
  avatar,
  alignment = roleToAlignment(message.role),
  onPress,
  className = "",
}) => {
  const messageColor = getMessageColor(message.role);
  const finalAvatar = avatar || getAvatar(message.role);

  const alignItems = alignment === "start" ? "items-start" : 
                     alignment === "end" ? "items-end" : "items-center";

  return (
    <View className={`w-full py-2 px-4 ${alignItems} ${className}`}>
      <View 
        className={`max-w-[80%] flex-row gap-2 ${alignItems}`}
        onTouchEnd={() => onPress?.(message)}
      >
        {/* Avatar */}
        {showAvatar && (
          <View className="w-6 h-6 rounded-full bg-muted items-center justify-center flex-shrink-0">
            <Text className="text-xs">{finalAvatar}</Text>
          </View>
        )}

        {/* Message content */}
        <View className={`flex-1 ${messageColor} border rounded-lg p-3`}>
          <Text className="text-foreground text-sm leading-relaxed">
            {message.content}
          </Text>
          
          {/* Timestamp */}
          {showTimestamp && message.timestamp && (
            <Text className="text-muted-foreground text-xs mt-1">
              {formatTime(message.timestamp)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

// Helper functions
function roleToAlignment(role: MessageRole): "start" | "end" | "center" {
  switch (role) {
    case "user":
      return "end";
    case "assistant":
      return "start";
    case "system":
      return "center";
    default:
      return "start";
  }
}

function getMessageColor(role: MessageRole): string {
  switch (role) {
    case "user":
      return "bg-primary/10 border-primary/20";
    case "assistant":
      return "bg-secondary/10 border-secondary/20";
    case "system":
      return "bg-muted border-border";
    default:
      return "bg-background border-border";
  }
}

function getAvatar(role: MessageRole): string {
  switch (role) {
    case "user":
      return "👤";
    case "assistant":
      return "🤖";
    case "system":
      return "ℹ️";
    default:
      return "🤖";
  }
}

function formatTime(date?: Date): string {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});

export default Conversation;