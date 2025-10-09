import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, X } from 'lucide-react-native';
import VoiceRecorder from './VoiceRecorder';
import { ContractFormData } from '@/types/contract';

interface FloatingAINavbarProps {
  visible?: boolean;
  contractData?: {
    source: string;
    formData: ContractFormData;
    onFillAI: () => void;
    onUpdateSource: (source: string) => void;
  };
}

export default function FloatingAINavbar({ visible = true, contractData }: FloatingAINavbarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [streamingText, setStreamingText] = useState<string>('');
  const insets = useSafeAreaInsets();
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(blurAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded, slideAnim, blurAnim]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleTranscriptionStream = (text: string) => {
    console.log('Streaming transcription:', text);
    setStreamingText(text);
  };

  const handleTranscription = (text: string) => {
    console.log('Transcription received:', text);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setStreamingText('');
    
    if (contractData) {
      contractData.onUpdateSource(text);
      setTimeout(() => {
        contractData.onFillAI();
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: "I've filled in the form with the information from your recording." 
        }]);
      }, 500);
    }
  };

  if (!visible) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const navbarTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <>
      {isExpanded && Platform.OS === 'web' && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: blurAnim,
            },
          ]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={handleToggle}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {isExpanded && Platform.OS !== 'web' && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: blurAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          ]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={handleToggle}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.navbar,
          {
            bottom: insets.bottom,
            transform: [{ translateY: navbarTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <MessageSquare color="#10B981" size={28} />
          <Text style={styles.navLabel}>ARA</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.drawerContainer,
          {
            bottom: 0,
            transform: [{ translateY }],
          },
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <View style={[styles.drawer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.drawerHeader}>
            <View style={styles.drawerHeaderLeft}>
              <MessageSquare color="#10B981" size={24} />
              <Text style={styles.drawerTitle}>ARA Assistant</Text>
            </View>
            <TouchableOpacity onPress={handleToggle} style={styles.closeButton}>
              <X color="#E5E7EB" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.messagesContainer}>
            {messages.length === 0 && !streamingText ? (
              <View style={styles.emptyState}>
                <MessageSquare color="#6B7280" size={48} />
                <Text style={styles.emptyStateTitle}>Voice Fill Assistant</Text>
                <Text style={styles.emptyStateText}>
                  Tap the microphone to record your voice and automatically fill in the form
                </Text>
              </View>
            ) : (
              <View style={styles.messagesList}>
                {messages.map((msg, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.messageBubble,
                      msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === 'user' ? styles.userText : styles.assistantText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                ))}
                {streamingText ? (
                  <View style={[styles.messageBubble, styles.streamingBubble]}>
                    <Text style={[styles.messageText, styles.streamingText]}>
                      {streamingText}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.recorderContainer}>
            <VoiceRecorder
              onTranscriptionComplete={handleTranscription}
              onTranscriptionStream={handleTranscriptionStream}
              onRecordingStateChange={(recording) => {
                console.log('Recording state:', recording);
              }}
            />
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  navbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    zIndex: 999,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navLabel: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '70%',
    zIndex: 1000,
  },
  drawer: {
    flex: 1,
    backgroundColor: '#000000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#E5E7EB',
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  messagesList: {
    flex: 1,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10B981',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#E5E7EB',
  },
  streamingBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  streamingText: {
    color: '#D1FAE5',
    fontStyle: 'italic' as const,
  },
  recorderContainer: {
    paddingVertical: 10,
  },
});
