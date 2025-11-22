import React, { useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Platform } from 'react-native';
import { MessageProps } from './Message';

export interface ConversationProps {
  children: React.ReactNode;
  autoScroll?: boolean;
  stickyToBottom?: boolean;
  onScroll?: (event: any) => void;
  testID?: string;
}

export default function Conversation({
  children,
  autoScroll = true,
  stickyToBottom = true,
  onScroll,
  testID = 'conversation',
}: ConversationProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const contentHeightRef = useRef<number>(0);
  const scrollHeightRef = useRef<number>(0);
  const isNearBottomRef = useRef<boolean>(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [children, autoScroll]);

  const scrollToBottom = (animated: boolean = true) => {
    scrollViewRef.current?.scrollToEnd({ animated });
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    contentHeightRef.current = contentSize.height;
    scrollHeightRef.current = layoutMeasurement.height;

    // Check if user is near bottom (within 100px)
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    isNearBottomRef.current = distanceFromBottom < 100;

    onScroll?.(event);
  };

  const handleContentSizeChange = (width: number, height: number) => {
    if (stickyToBottom && isNearBottomRef.current) {
      scrollToBottom(true);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        testID={testID}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
});
