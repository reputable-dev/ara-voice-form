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
  Dimensions,
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
  X,
  Paperclip,
} from 'lucide-react-native';

interface FloatingAINavbarProps {
  visible?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 70;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.5;

export default function FloatingAINavbar({ visible = true }: FloatingAINavbarProps) {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! How can I assist you today?' }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('home');
  const insets = useSafeAreaInsets();
  
  const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: isChatOpen ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [isChatOpen, heightAnim]);

  const handleToggle = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const handleCancel = () => {
    setIsChatOpen(false);
    setInputText('');
    setActiveTab('home');
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const userMessage = inputText.trim();
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      setInputText('');
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, I don't have enough information to answer that question. Could you please provide more details?" 
        }]);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 1000);
    }
  };



  if (!visible) return null;

  const renderDefaultIcons = () => (
    <>
      <TouchableOpacity
        style={[styles.iconButton, activeTab === 'home' && styles.iconButtonActive]}
        onPress={() => setActiveTab('home')}
        activeOpacity={0.7}
      >
        <Home color="#3B82F6" size={22} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, activeTab === 'tasks' && styles.iconButtonActive]}
        onPress={() => setActiveTab('tasks')}
        activeOpacity={0.7}
      >
        <ClipboardList color="#F59E0B" size={22} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, styles.botButton]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Bot color="#10B981" size={24} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, activeTab === 'schedule' && styles.iconButtonActive]}
        onPress={() => setActiveTab('schedule')}
        activeOpacity={0.7}
      >
        <Calendar color="#10B981" size={22} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, activeTab === 'team' && styles.iconButtonActive]}
        onPress={() => setActiveTab('team')}
        activeOpacity={0.7}
      >
        <Users color="#8B5CF6" size={22} />
      </TouchableOpacity>
    </>
  );

  const renderChatIcons = () => (
    <>
      <TouchableOpacity
        style={[styles.iconButton, styles.iconButtonActive]}
        onPress={() => setActiveTab('home')}
        activeOpacity={0.7}
      >
        <Home color="#3B82F6" size={22} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton]}
        activeOpacity={0.7}
      >
        <Paperclip color="#F59E0B" size={22} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, styles.sendButton]}
        onPress={handleSendMessage}
        activeOpacity={0.7}
      >
        <Send color="#10B981" size={18} />
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton]}
        activeOpacity={0.7}
      >
        <Mic color="#F97316" size={22} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, styles.cancelButton]}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <X color="#EF4444" size={22} />
      </TouchableOpacity>
    </>
  );

  return (
    <>
      {isChatOpen && (
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
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
            <View style={styles.chatContainer}>
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                  <Bot color="#10B981" size={24} />
                  <Text style={styles.chatTitle}>AI Assistant</Text>
                </View>
              </View>

              <ScrollView 
                ref={scrollViewRef}
                style={styles.messagesScroll}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
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
                      {msg.content}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.inputContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type your message..."
                  placeholderTextColor="#6B7280"
                  multiline={false}
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  navbarContainer: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  navbar: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  chatContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#F3F4F6',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 16,
    gap: 12,
  },
  inputContainer: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F3F4F6',
    fontSize: 15,
    minHeight: 44,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: COLLAPSED_HEIGHT,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  botButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  sendButton: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    width: 'auto',
    height: 'auto',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  sendText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#E5E7EB',
  },
});
