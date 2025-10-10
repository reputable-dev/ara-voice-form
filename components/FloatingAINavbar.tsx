import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Home, 
  ClipboardList, 
  Bot, 
  Calendar, 
  Users,
  Send,
  Mic,
  X 
} from 'lucide-react-native';

interface ContractData {
  source: string;
  formData: any;
  onFillAI: () => void;
  onUpdateSource: (source: string) => void;
}

interface FloatingAINavbarProps {
  visible?: boolean;
  contractData?: ContractData;
}

export default function FloatingAINavbar({ visible = true, contractData }: FloatingAINavbarProps) {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('home');
  const insets = useSafeAreaInsets();
  
  const heightAnim = useRef(new Animated.Value(80)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: isChatOpen ? 500 : 80,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(blurAnim, {
        toValue: isChatOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isChatOpen, heightAnim, blurAnim]);

  const handleToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleCancel = () => {
    setIsChatOpen(false);
    setInputText('');
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      setMessages(prev => [...prev, { role: 'user', text: inputText }]);
      setInputText('');
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: "I'm here to help! How can I assist you today?" 
        }]);
      }, 500);
    }
  };



  if (!visible) return null;

  const renderDefaultIcons = () => (
    <>
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'home' && styles.navButtonActive]}
        onPress={() => setActiveTab('home')}
        activeOpacity={0.8}
      >
        <Home color={activeTab === 'home' ? '#3B82F6' : '#6B7280'} size={24} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'tasks' && styles.navButtonActive]}
        onPress={() => setActiveTab('tasks')}
        activeOpacity={0.8}
      >
        <ClipboardList color={activeTab === 'tasks' ? '#F59E0B' : '#6B7280'} size={24} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, styles.navButtonPrimary]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <Bot color="#10B981" size={28} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'schedule' && styles.navButtonActive]}
        onPress={() => setActiveTab('schedule')}
        activeOpacity={0.8}
      >
        <Calendar color={activeTab === 'schedule' ? '#10B981' : '#6B7280'} size={24} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'team' && styles.navButtonActive]}
        onPress={() => setActiveTab('team')}
        activeOpacity={0.8}
      >
        <Users color={activeTab === 'team' ? '#8B5CF6' : '#6B7280'} size={24} />
      </TouchableOpacity>
    </>
  );

  const renderChatIcons = () => (
    <>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => setActiveTab('home')}
        activeOpacity={0.8}
      >
        <Home color="#3B82F6" size={24} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, styles.sendButton]}
        onPress={handleSendMessage}
        activeOpacity={0.8}
      >
        <Send color="#10B981" size={20} />
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        activeOpacity={0.8}
      >
        <Mic color="#F97316" size={24} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={handleCancel}
        activeOpacity={0.8}
      >
        <X color="#EF4444" size={24} />
      </TouchableOpacity>
    </>
  );

  return (
    <>
      {isChatOpen && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: blurAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          ]}
          pointerEvents={isChatOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={handleCancel}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.navbarContainer,
          {
            bottom: insets.bottom + 16,
            height: heightAnim,
          },
        ]}
      >
        <View style={styles.navbar}>
          {isChatOpen && (
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                  <Bot color="#10B981" size={24} />
                  <Text style={styles.chatTitle}>AI Assistant</Text>
                </View>
              </View>

              <ScrollView 
                style={styles.messagesScroll}
                contentContainerStyle={styles.messagesContent}
              >
                {messages.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Bot color="#6B7280" size={48} />
                    <Text style={styles.emptyStateTitle}>AI Assistant</Text>
                    <Text style={styles.emptyStateText}>
                      Type a message or use voice to interact with the assistant
                    </Text>
                  </View>
                ) : (
                  messages.map((msg, idx) => (
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
                  ))
                )}
              </ScrollView>

              <View style={styles.inputContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type your message..."
                  placeholderTextColor="#6B7280"
                  multiline
                  maxLength={500}
                  onSubmitEditing={handleSendMessage}
                />
              </View>
            </View>
          )}

          <View style={styles.navButtons}>
            {isChatOpen ? renderChatIcons() : renderDefaultIcons()}
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
  navbarContainer: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  navbar: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
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
  chatContent: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#E5E7EB',
  },
  messagesScroll: {
    flex: 1,
    marginBottom: 12,
  },
  messagesContent: {
    flexGrow: 1,
    gap: 12,
    paddingBottom: 8,
  },
  inputContainer: {
    paddingBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#E5E7EB',
    fontSize: 15,
    maxHeight: 100,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 70,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
  },
  navButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonPrimary: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 12,
  },
  sendButton: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
  },
  sendText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
    minHeight: 200,
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
    textAlign: 'center' as const,
    lineHeight: 20,
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
});
