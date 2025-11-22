import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

export interface ResponseProps {
  content: string;
  isStreaming?: boolean;
  streamSpeed?: number; // characters per frame (default: 2)
  onStreamComplete?: () => void;
  testID?: string;
}

export default function Response({
  content,
  isStreaming = false,
  streamSpeed = 2,
  onStreamComplete,
  testID = 'response',
}: ResponseProps) {
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(!isStreaming);
  const currentIndexRef = useRef<number>(0);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // Streaming animation
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      setIsComplete(true);
      return;
    }

    if (currentIndexRef.current >= content.length) {
      setIsComplete(true);
      onStreamComplete?.();
      return;
    }

    const interval = setInterval(() => {
      if (currentIndexRef.current < content.length) {
        const nextIndex = Math.min(
          currentIndexRef.current + streamSpeed,
          content.length
        );
        setDisplayedContent(content.substring(0, nextIndex));
        currentIndexRef.current = nextIndex;

        if (nextIndex >= content.length) {
          setIsComplete(true);
          onStreamComplete?.();
        }
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [content, isStreaming, streamSpeed, onStreamComplete]);

  // Cursor blinking animation
  useEffect(() => {
    if (isComplete) {
      cursorOpacity.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 530,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 530,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [isComplete, cursorOpacity]);

  // Parse markdown-style formatting (basic support)
  const renderFormattedText = (text: string) => {
    // Split by code blocks
    const parts = text.split(/(`{1,3}[^`]+`{1,3})/g);

    return parts.map((part, index) => {
      // Code block
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim();
        return (
          <View key={index} style={styles.codeBlock}>
            <Text style={styles.codeText}>{code}</Text>
          </View>
        );
      }

      // Inline code
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <Text key={index} style={styles.inlineCode}>
            {code}
          </Text>
        );
      }

      // Bold text **text**
      if (part.match(/\*\*(.+?)\*\*/)) {
        return (
          <Text key={index} style={styles.boldText}>
            {part.replace(/\*\*/g, '')}
          </Text>
        );
      }

      // Normal text
      return <Text key={index} style={styles.normalText}>{part}</Text>;
    });
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.contentWrapper}>
        {renderFormattedText(displayedContent)}
        {!isComplete && (
          <Animated.View style={[styles.cursor, { opacity: cursorOpacity }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  contentWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  normalText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
  },
  boldText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    fontWeight: '600',
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: Colors.light.tint,
  },
  codeBlock: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#D4D4D4',
    lineHeight: 20,
  },
  cursor: {
    width: 2,
    height: 20,
    backgroundColor: Colors.light.tint,
    marginLeft: 2,
  },
});
