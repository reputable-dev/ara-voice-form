import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';
import { Send, X, MessageSquare, Home, FileCog, BarChart3, MapPin, Clock, TrendingUp, MoreHorizontal, Bell, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';

interface ChatMessage {
  id: string;
  icon: React.ComponentType<any>;
  question: string;
  answer: string;
}

interface FloatingAINavbarProps {
  visible?: boolean;
}

export default function FloatingAINavbar({ visible = true }: FloatingAINavbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  
  console.log('FloatingAINavbar - Current pathname:', pathname);

  const [chatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      icon: BarChart3,
      question: 'What was the last inspection rating?',
      answer: 'The last inspection rating was 92/100, conducted on March 15, 2023.'
    },
    {
      id: '2',
      icon: MapPin,
      question: 'When was the Willetton location last inspected?',
      answer: 'The Willetton location was last inspected on February 8, 2023 with a rating of 88/100.'
    },
    {
      id: '3',
      icon: Clock,
      question: 'How many inspections were conducted last month?',
      answer: 'There were 14 inspections conducted last month across all locations.'
    },
    {
      id: '4',
      icon: TrendingUp,
      question: "What's the trend in inspection ratings?",
      answer: 'Inspection ratings have improved by 7% on average over the last quarter.'
    }
  ]);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      console.log('Sending message:', inputText);
      setInputText('');
      if (Platform.OS !== 'web') {
        // Haptics would go here
      }
    }
  };



  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: slideAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={toggleExpanded}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Expanded Chat Interface */}
      <Animated.View
        style={[
          styles.expandedContainer,
          {
            bottom: insets.bottom + 80,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [500, 0],
                }),
              },
            ],
            opacity: slideAnim,
          },
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} style={styles.expandedBlur}>
            <View style={styles.expandedContent}>
              <View style={styles.expandedHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.aiIconLarge}>
                    <View style={styles.aiIconGrid}>
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    </View>
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>AI Assistant</Text>
                    <Text style={styles.headerSubtitle}>Tap to speak</Text>
                  </View>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity style={styles.headerButton}>
                    <Bell size={18} color={Colors.light.subtle} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerButton}>
                    <Settings size={18} color={Colors.light.subtle} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleExpanded} style={styles.closeButton}>
                    <X size={18} color={Colors.light.subtle} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.chatArea}>
                <View style={styles.welcomeMessage}>
                  <Text style={styles.welcomeText}>
                    How can I help you today?
                  </Text>
                </View>
                
                <View style={styles.chatHistory}>
                  {chatMessages.map((message) => {
                    const IconComponent = message.icon;
                    return (
                      <View key={message.id} style={styles.chatMessage}>
                        <View style={styles.messageHeader}>
                          <View style={styles.messageIcon}>
                            <IconComponent size={16} color={Colors.light.subtle} />
                          </View>
                          <Text style={styles.messageQuestion}>{message.question}</Text>
                        </View>
                        <Text style={styles.messageAnswer}>{message.answer}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputSection}>
                <View style={styles.inputRow}>
                  <View style={styles.aiIconSmall}>
                    <View style={styles.aiIconGrid}>
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder=""
                      placeholderTextColor={Colors.light.subtle}
                      multiline
                      maxLength={500}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.sendButtonLarge}
                    onPress={handleSendMessage}
                  >
                    <Send size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </BlurView>
        ) : (
          <View style={[styles.expandedBlur, styles.androidBlur]}>
            <View style={styles.expandedContent}>
              <View style={styles.expandedHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.aiIconLarge}>
                    <View style={styles.aiIconGrid}>
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    </View>
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>AI Assistant</Text>
                    <Text style={styles.headerSubtitle}>Tap to speak</Text>
                  </View>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity style={styles.headerButton}>
                    <Bell size={18} color={Colors.light.subtle} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerButton}>
                    <Settings size={18} color={Colors.light.subtle} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleExpanded} style={styles.closeButton}>
                    <X size={18} color={Colors.light.subtle} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.chatArea}>
                <View style={styles.welcomeMessage}>
                  <Text style={styles.welcomeText}>
                    How can I help you today?
                  </Text>
                </View>
                
                <View style={styles.chatHistory}>
                  {chatMessages.map((message) => {
                    const IconComponent = message.icon;
                    return (
                      <View key={message.id} style={styles.chatMessage}>
                        <View style={styles.messageHeader}>
                          <View style={styles.messageIcon}>
                            <IconComponent size={16} color={Colors.light.subtle} />
                          </View>
                          <Text style={styles.messageQuestion}>{message.question}</Text>
                        </View>
                        <Text style={styles.messageAnswer}>{message.answer}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputSection}>
                <View style={styles.inputRow}>
                  <View style={styles.aiIconSmall}>
                    <View style={styles.aiIconGrid}>
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.subtle }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                      <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder=""
                      placeholderTextColor={Colors.light.subtle}
                      multiline
                      maxLength={500}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.sendButtonLarge}
                    onPress={handleSendMessage}
                  >
                    <Send size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Bottom Navbar */}
      <Animated.View
        style={[
          styles.navbar,
          {
            bottom: insets.bottom,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} style={styles.navbarBlur}>
            <View style={styles.navbarContent}>
              <TouchableOpacity
                style={styles.navbarButton}
onPress={() => {
                  try {
                    router.replace('/dashboard');
                  } catch (error) {
                    console.error('Navigation error to dashboard:', error);
                  }
                }}
                testID="homeTab"
              >
                <Home size={24} color={pathname === '/dashboard' ? Colors.light.tint : Colors.light.subtle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
onPress={() => {
                  try {
                    router.replace('/contract');
                  } catch (error) {
                    console.error('Navigation error to contract:', error);
                  }
                }}
                testID="contractTab"
              >
                <FileCog size={24} color={pathname === '/contract' ? Colors.light.tint : Colors.light.subtle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centralAIButton}
                onPress={toggleExpanded}
                testID="aiAssistantButton"
              >
                <View style={styles.centralAIIcon}>
                  <View style={styles.aiIconGrid}>
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: '#666' }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: '#666' }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: '#666' }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
onPress={() => {
                  try {
                    router.replace('/');
                  } catch (error) {
                    console.error('Navigation error to assistant:', error);
                  }
                }}
                testID="assistantTab"
              >
                <MessageSquare size={24} color={pathname === '/' ? Colors.light.tint : Colors.light.subtle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {}}
                testID="moreTab"
              >
                <MoreHorizontal size={24} color={Colors.light.subtle} />
              </TouchableOpacity>
            </View>
          </BlurView>
        ) : (
          <View style={[styles.navbarBlur, styles.androidBlur]}>
            <View style={styles.navbarContent}>
              <TouchableOpacity
                style={styles.navbarButton}
onPress={() => {
                  try {
                    router.replace('/dashboard');
                  } catch (error) {
                    console.error('Navigation error to dashboard:', error);
                  }
                }}
                testID="homeTab"
              >
                <Home size={24} color={pathname === '/dashboard' ? Colors.light.tint : Colors.light.subtle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
onPress={() => {
                  try {
                    router.replace('/contract');
                  } catch (error) {
                    console.error('Navigation error to contract:', error);
                  }
                }}
                testID="contractTab"
              >
                <FileCog size={24} color={pathname === '/contract' ? Colors.light.tint : Colors.light.subtle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centralAIButton}
                onPress={toggleExpanded}
                testID="aiAssistantButton"
              >
                <View style={styles.centralAIIcon}>
                  <View style={styles.aiIconGrid}>
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: '#666' }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: '#666' }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: '#666' }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                    <View style={[styles.aiIconDot, { backgroundColor: Colors.light.tint }]} />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
onPress={() => {
                  try {
                    router.replace('/');
                  } catch (error) {
                    console.error('Navigation error to assistant:', error);
                  }
                }}
                testID="assistantTab"
              >
                <MessageSquare size={24} color={pathname === '/' ? Colors.light.tint : Colors.light.subtle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {}}
                testID="moreTab"
              >
                <MoreHorizontal size={24} color={Colors.light.subtle} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  backdropTouchable: {
    flex: 1,
  },
  expandedContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 500,
    zIndex: 1000,
    borderRadius: 16,
    overflow: 'hidden',
  },
  expandedBlur: {
    flex: 1,
    borderRadius: 16,
  },
  androidBlur: {
    backgroundColor: Colors.light.card + 'F2',
  },
  expandedContent: {
    flex: 1,
    padding: 16,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + '4D',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  aiIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  aiIconGrid: {
    width: 12,
    height: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  aiIconDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    margin: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.subtle,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  closeButton: {
    padding: 4,
  },
  chatArea: {
    flex: 1,
  },
  welcomeMessage: {
    backgroundColor: Colors.light.surface + '99',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border + '4D',
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  chatHistory: {
    gap: 12,
  },
  chatMessage: {
    backgroundColor: Colors.light.surface + '66',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border + '33',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  messageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  messageAnswer: {
    fontSize: 14,
    color: Colors.light.subtle,
    lineHeight: 20,
  },
  inputSection: {
    marginTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: Colors.light.inputBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textInput: {
    color: Colors.light.text,
    fontSize: 14,
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendButtonLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 60,
    zIndex: 1000,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  navbarBlur: {
    flex: 1,
    borderRadius: 30,
  },
  navbarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  navbarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  centralAIButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#444',
    marginHorizontal: 8,
  },
  centralAIIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});