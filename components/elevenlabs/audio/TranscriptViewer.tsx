import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';

export interface Word {
  text: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
}

export interface TranscriptViewerProps {
  words: Word[];
  currentTime: number; // Current playback time in seconds
  onWordPress?: (word: Word, index: number) => void;
  highlightColor?: string;
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
  autoScroll?: boolean;
  testID?: string;
}

export default function TranscriptViewer({
  words,
  currentTime,
  onWordPress,
  highlightColor = Colors.light.tint,
  textColor = Colors.light.text,
  fontSize = 16,
  lineHeight = 28,
  autoScroll = true,
  testID = 'transcript-viewer',
}: TranscriptViewerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const wordRefs = useRef<(View | null)[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);

  // Find the current active word based on playback time
  useEffect(() => {
    const currentIndex = words.findIndex(
      (word) => currentTime >= word.startTime && currentTime < word.endTime
    );

    if (currentIndex !== -1 && currentIndex !== activeWordIndex) {
      setActiveWordIndex(currentIndex);

      // Auto-scroll to active word
      if (autoScroll && wordRefs.current[currentIndex]) {
        wordRefs.current[currentIndex]?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 100), // Keep word near top with 100px padding
              animated: true,
            });
          },
          () => {} // Error callback
        );
      }
    }
  }, [currentTime, words, autoScroll, activeWordIndex]);

  const handleWordPress = (word: Word, index: number) => {
    if (onWordPress) {
      onWordPress(word, index);
    }
  };

  const isWordActive = (index: number) => index === activeWordIndex;

  const isWordPassed = (index: number, word: Word) =>
    currentTime > word.endTime;

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      testID={testID}
    >
      <View style={styles.textContainer}>
        {words.map((word, index) => {
          const isActive = isWordActive(index);
          const isPassed = isWordPassed(index, word);

          return (
            <Pressable
              key={`${word.text}-${index}`}
              onPress={() => handleWordPress(word, index)}
              ref={(ref) => {
                wordRefs.current[index] = ref as any;
              }}
            >
              <Text
                style={[
                  styles.word,
                  {
                    color: isActive ? highlightColor : textColor,
                    fontSize,
                    lineHeight,
                    opacity: isPassed ? 0.5 : 1,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {word.text}
                {' '}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  word: {
    marginRight: 2,
  },
});
