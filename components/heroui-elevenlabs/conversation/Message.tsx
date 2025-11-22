"use client";

import React from "react";
import { View, Text } from "react-native";
import { Card } from "@heroui/react";

export type MessageRole = "user" | "assistant" | "system";

export interface MessageProps {
  /**
   * The message content
   */
  content: string;

  /**
   * Role of the message sender
   */
  role: MessageRole;

  /**
   * Message timestamp
   */
  timestamp?: Date;

  /**
   * Whether the message is currently being typed/streamed
   * @default false
   */
  isTyping?: boolean;

  /**
   * Custom avatar to display
   */
  avatar?: React.ReactNode;

  /**
   * Whether to show avatar
   * @default true
   */
  showAvatar?: boolean;

  /**
   * Whether to show timestamp
   * @default false
   */
  showTimestamp?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Callback when message is pressed
   */
  onPress?: () => void;

  /**
   * Message alignment
   * @default "auto" (based on role)
   */
  alignment?: "auto" | "start" | "end" | "center";

  /**
   * Message ID for uniqueness
   */
  id?: string;
}

export const Message: React.FC<MessageProps> = ({
  content,
  role,
  timestamp,
  isTyping = false,
  avatar,
  showAvatar = true,
  showTimestamp = false,
  className = "",
  onPress,
  alignment = "auto",
  id,
}) => {
  const getAlignment = () => {
    if (alignment !== "auto") return alignment;
    return role === "user" ? "end" : role === "system" ? "center" : "start";
  };

  const getAvatar = () => {
    if (avatar) return avatar;
    return role === "user" ? "👤" : role === "system" ? "ℹ️" : "🤖";
  };

  const getCardVariant = () => {
    switch (role) {
      case "user":
        return "primary" as const;
      case "assistant":
        return "secondary" as const;
      case "system":
        return "ghost" as const;
      default:
        return "secondary" as const;
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const messageAlignment = getAlignment();
  const alignmentClass = messageAlignment === "start" ? "items-start" :
                        messageAlignment === "end" ? "items-end" : "items-center";

  return (
    <View className={`w-full py-2 px-4 ${alignmentClass} ${className}`}>
      <View className={`flex-row gap-2 max-w-[80%] ${alignmentClass}`}>
        {/* Avatar */}
        {showAvatar && (
          <View className="w-6 h-6 rounded-full bg-muted items-center justify-center flex-shrink-0">
            <Text className="text-xs">{getAvatar()}</Text>
          </View>
        )}

        {/* Message Card */}
        <Card
          variant={getCardVariant()}
          className="flex-1 p-3"
          onPress={onPress}
        >
          {/* Message Content */}
          <Text className="text-foreground text-sm leading-relaxed">
            {content}
            {isTyping && (
              <Text className="animate-pulse">|</Text>
            )}
          </Text>

          {/* Timestamp */}
          {showTimestamp && timestamp && (
            <Text className="text-muted-foreground text-xs mt-1">
              {formatTime(timestamp)}
            </Text>
          )}
        </Card>
      </View>
    </View>
  );
};

// Streaming message component for AI responses
export interface StreamingMessageProps extends Omit<MessageProps, "children"> {
  /**
   * Current streaming content
   */
  streamingContent?: string;

  /**
   * Full content (completed)
   */
  fullContent?: string;

  /**
   * Whether streaming is active
   * @default false
   */
  isStreaming?: boolean;

  /**
   * Typing animation speed in ms
   * @default 50
   */
  typingSpeed?: number;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  streamingContent = "",
  fullContent = "",
  isStreaming = false,
  typingSpeed = 50,
  ...messageProps
}) => {
  const [displayedContent, setDisplayedContent] = React.useState(fullContent);

  React.useEffect(() => {
    if (isStreaming && streamingContent) {
      setDisplayedContent(streamingContent);
    } else if (!isStreaming && fullContent) {
      setDisplayedContent(fullContent);
    } else {
      setDisplayedContent(content);
    }
  }, [content, streamingContent, fullContent, isStreaming]);

  return (
    <Message
      content={displayedContent}
      isTyping={isStreaming}
      {...messageProps}
    />
  );
};

// Typing indicator component
export interface TypingIndicatorProps {
  /**
   * Who is typing
   */
  role?: MessageRole;

  /**
   * Custom avatar
   */
  avatar?: React.ReactNode;

  /**
   * Custom message
   * @default "Typing..."
   */
  message?: string;

  /**
   * Custom className
   */
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  role = "assistant",
  avatar,
  message = "Typing...",
  className = "",
}) => {
  const getAvatar = () => {
    if (avatar) return avatar;
    return role === "user" ? "👤" : role === "system" ? "ℹ️" : "🤖";
  };

  return (
    <View className={`w-full py-2 px-4 items-start ${className}`}>
      <View className="flex-row gap-2 max-w-[80%]">
        {/* Avatar */}
        <View className="w-6 h-6 rounded-full bg-muted items-center justify-center flex-shrink-0">
          <Text className="text-xs">{getAvatar()}</Text>
        </View>

        {/* Typing indicator */}
        <Card variant="secondary" className="px-3 py-2">
          <Text className="text-muted-foreground text-sm">
            <Text className="animate-pulse">●</Text>
            <Text className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</Text>
            <Text className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</Text>
          </Text>
        </Card>
      </View>
    </View>
  );
};

// System message component for notifications
export interface SystemMessageProps {
  /**
   * Message content
   */
  content: string;

  /**
   * Message variant (info/warning/error/success)
   * @default "info"
   */
  variant?: "info" | "warning" | "error" | "success";

  /**
   * Custom icon
   */
  icon?: React.ReactNode;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Callback when message is pressed
   */
  onPress?: () => void;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({
  content,
  variant = "info",
  icon,
  className = "",
  onPress,
}) => {
  const getIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "success":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  const getCardVariant = () => {
    switch (variant) {
      case "warning":
        return "warning" as const;
      case "error":
        return "danger" as const;
      case "success":
        return "success" as const;
      default:
        return "ghost" as const;
    }
  };

  return (
    <View className={`w-full py-2 px-4 items-center ${className}`}>
      <Card variant={getCardVariant()} className="max-w-[80%] px-3 py-2" onPress={onPress}>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm">{getIcon()}</Text>
          <Text className="text-foreground text-sm text-center">{content}</Text>
        </View>
      </Card>
    </View>
  );
};

// Default exports
export default Message;