"use client";

import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { Card } from "@heroui/react";

export interface Word {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptViewerProps {
  /**
   * Array of words with timestamps
   */
  words: Word[];

  /**
   * Current playback time in seconds
   */
  currentTime: number;

  /**
   * Whether playback is active
   * @default false
   */
  isPlaying?: boolean;

  /**
   * Whether to show timestamps
   * @default false
   */
  showTimestamps?: boolean;

  /**
   * Whether to highlight current word
   * @default true
   */
  highlightCurrentWord?: boolean;

  /**
   * Color for highlighted words
   */
  highlightColor?: string;

  /**
   * Normal text color
   */
  textColor?: string;

  /**
   * Font size
   * @default 16
   */
  fontSize?: number;

  /**
   * Line spacing
   * @default 1.5
   */
  lineHeight?: number;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Callback when word is pressed
   */
  onWordPress?: (word: Word, index: number) => void;

  /**
   * Whether to show confidence scores
   * @default false
   */
  showConfidence?: boolean;

  /**
   * Animation duration for highlighting (ms)
   * @default 200
   */
  animationDuration?: number;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  words = [],
  currentTime,
  isPlaying = false,
  showTimestamps = false,
  highlightCurrentWord = true,
  highlightColor = "#007AFF",
  textColor = "#000000",
  fontSize = 16,
  lineHeight = 1.5,
  className = "",
  onWordPress,
  showConfidence = false,
  animationDuration = 200,
}) => {
  const animatedValues = useRef<Animated.Value[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize animated values
  useEffect(() => {
    animatedValues.current = words.map(() => new Animated.Value(0));
    setInitialized(true);
  }, [words]);

  // Animate word highlighting based on playback time
  useEffect(() => {
    if (!initialized || !highlightCurrentWord) {
      // Reset all animations when disabled
      if (initialized && animatedValues.current.length > 0) {
        animatedValues.current.forEach((value) => {
          value.setValue(0);
        });
      }
      return;
    }

    // Find which words should be highlighted
    words.forEach((word, index) => {
      const shouldHighlight = currentTime >= word.start && currentTime <= word.end;
      animatedValues.current[index].setValue(shouldHighlight ? 1 : 0);
    });
  }, [currentTime, words, highlightCurrentWord, initialized]);

  if (words.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <Text className="text-muted-foreground text-center">
          No transcript available
        </Text>
      </Card>
    );
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return textColor;
    
    if (confidence >= 0.9) return textColor; // High confidence - normal
    if (confidence >= 0.7) return "#666666"; // Medium confidence - dimmed
    return "#999999"; // Low confidence - very dimmed
  };

  return (
    <Card className={`p-4 ${className}`}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {words.map((word, index) => {
          const isCurrentWord = highlightCurrentWord && 
            currentTime >= word.start && currentTime <= word.end;

          const wordColor = showConfidence ? getConfidenceColor(word.confidence) : textColor;

          return (
            <View key={index}>
              <Animated.View
                style={{
                  opacity: animatedValues.current[index]?.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }) || 1,
                }}
              >
                <Text
                  onPress={() => onWordPress?.(word, index)}
                  style={{
                    fontSize,
                    color: isCurrentWord ? highlightColor : wordColor,
                    backgroundColor: isCurrentWord ? `${highlightColor}20` : 'transparent',
                    fontWeight: isCurrentWord ? '600' : '400',
                    lineHeight: fontSize * lineHeight,
                    marginRight: 4,
                    marginBottom: 2,
                    borderRadius: 2,
                    paddingHorizontal: 2,
                  }}
                >
                  {word.text}
                </Text>
              </Animated.View>

              {/* Timestamp display */}
              {showTimestamps && index === 0 && (
                <Text className="text-muted-foreground text-xs mr-2">
                  [{formatTime(word.start)}]
                </Text>
              )}

              {/* Confidence display */}
              {showConfidence && word.confidence && (
                <Text 
                  className="text-muted-foreground text-xs mr-1"
                  style={{ fontSize: fontSize * 0.6 }}
                >
                  ({Math.round(word.confidence * 100)}%)
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Current playback indicator */}
      {isPlaying && highlightCurrentWord && (
        <View className="mt-4 pt-2 border-t border-border">
          <Text className="text-muted-foreground text-sm">
            Current time: {formatTime(currentTime)}
          </Text>
        </View>
      )}
    </Card>
  );
};

// Simplified transcript viewer for static display
export interface SimpleTranscriptProps {
  /**
   * Transcript text
   */
  text: string;

  /**
   * Font size
   * @default 16
   */
  fontSize?: number;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Whether transcript is loading
   * @default false
   */
  isLoading?: boolean;

  /**
   * Callback when transcript is pressed
   */
  onPress?: () => void;
}

export const SimpleTranscript: React.FC<SimpleTranscriptProps> = ({
  text,
  fontSize = 16,
  className = "",
  isLoading = false,
  onPress,
}) => {
  return (
    <Card className={`p-4 ${className}`} onPress={onPress}>
      {isLoading ? (
        <View className="flex-row items-center gap-2">
          <Text className="animate-pulse">●</Text>
          <Text className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</Text>
          <Text className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</Text>
        </View>
      ) : (
        <Text style={{ fontSize, lineHeight: fontSize * 1.5 }}>
          {text || "No transcript available"}
        </Text>
      )}
    </Card>
  );
};

// Paragraph-based transcript viewer with paragraph-level highlighting
export interface Paragraph {
  text: string;
  start: number;
  end: number;
  words?: Word[];
}

export interface ParagraphTranscriptProps {
  /**
   * Array of paragraphs with timestamps
   */
  paragraphs: Paragraph[];

  /**
   * Current playback time in seconds
   */
  currentTime: number;

  /**
   * Whether playback is active
   * @default false
   */
  isPlaying?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Callback when paragraph is pressed
   */
  onParagraphPress?: (paragraph: Paragraph, index: number) => void;

  /**
   * Font size
   * @default 16
   */
  fontSize?: number;

  /**
   * Line spacing
   * @default 1.6
   */
  lineHeight?: number;
}

export const ParagraphTranscript: React.FC<ParagraphTranscriptProps> = ({
  paragraphs = [],
  currentTime,
  isPlaying = false,
  className = "",
  onParagraphPress,
  fontSize = 16,
  lineHeight = 1.6,
}) => {
  return (
    <Card className={`p-4 ${className}`}>
      {paragraphs.length === 0 ? (
        <Text className="text-muted-foreground text-center">
          No transcript available
        </Text>
      ) : (
        <View>
          {paragraphs.map((paragraph, index) => {
            const isCurrentParagraph = currentTime >= paragraph.start && currentTime <= paragraph.end;

            return (
              <View key={index} style={{ marginBottom: 16 }}>
                <Text
                  onPress={() => onParagraphPress?.(paragraph, index)}
                  style={{
                    fontSize,
                    lineHeight: fontSize * lineHeight,
                    color: isCurrentParagraph ? "#007AFF" : "#000000",
                    fontWeight: isCurrentParagraph ? "600" : "400",
                    backgroundColor: isCurrentParagraph ? "#007AFF20" : "transparent",
                    padding: 4,
                    borderRadius: 4,
                  }}
                >
                  {paragraph.text}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Current playback indicator */}
      {isPlaying && (
        <View className="mt-4 pt-2 border-t border-border">
          <Text className="text-muted-foreground text-sm">
            {paragraphs.length > 0 ? `Paragraph ${paragraphs.findIndex(p => currentTime >= p.start && currentTime <= p.end) + 1} of ${paragraphs.length}` : "No paragraphs"}
            {" • "}
            Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
          </Text>
        </View>
      )}
    </Card>
  );
};

// Default export
export default TranscriptViewer;