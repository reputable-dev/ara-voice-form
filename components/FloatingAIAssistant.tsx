import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  ScrollView,
  Platform,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import {
  MessageSquare,
  Mic,
  Send,
  ChevronDown,
  Sparkles,
  Bot,
  User,
  Wand2,
  FileText,
} from 'lucide-react-native';
import { ContractFormData } from '@/types/contract';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FloatingAIAssistantProps {
  testID?: string;
  contractData?: {
    source: string;
    formData: ContractFormData;
    onFillAI: () => void;
    onUpdateSource: (source: string) => void;
  };
}

export default function FloatingAIAssistant({ testID, contractData }: FloatingAIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: contractData 
        ? 'Hi! I\'m your AI assistant. I can help you fill out contract forms, parse source documents, and answer questions. You can also edit the source document directly here. How can I assist you today?'
        : 'Hi! I\'m your AI assistant. I can help you with questions and provide guidance. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sourceText, setSourceText] = useState<string>(contractData?.source || '');
  const [showSourceEditor, setShowSourceEditor] = useState<boolean>(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const toggleExpanded = useCallback(() => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    
    setIsExpanded(!isExpanded);
  }, [isExpanded, slideAnim]);

  const handleFillWithAI = useCallback(() => {
    if (!contractData) return;
    
    try {
      contractData.onFillAI();
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I\'ve successfully filled the contract form with data from the source document. Please review the filled fields and make any necessary adjustments.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      Alert.alert('Error', 'Failed to fill form with AI. Please check the source document format.');
    }
  }, [contractData]);

  const handleUpdateSource = useCallback(() => {
    if (!contractData) return;
    
    contractData.onUpdateSource(sourceText);
    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Source document updated successfully. You can now use "Fill with AI" to parse the updated content.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);
    setShowSourceEditor(false);
  }, [contractData, sourceText]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: contractData 
          ? `I understand you're asking about "${userMessage.content}". I can help you with contract forms, document parsing, and general assistance. You can use the "Fill with AI" button to automatically populate the form, or edit the source document directly. Is there something specific you'd like me to help you with?`
          : `I understand you're asking about "${userMessage.content}". I can help you with general questions and guidance. Is there something specific you'd like me to help you with?`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  }, [inputText, contractData]);

  const drawerHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenHeight * 0.6],
  });

  const navbarOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });

  return (
    <View style={[styles.container, { bottom: insets.bottom }]} testID={testID}>
      {/* Expandable Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            height: drawerHeight,
            marginBottom: isExpanded ? 0 : -screenHeight * 0.6,
          },
        ]}
      >
        <View style={styles.drawerContent}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.headerLeft}>
              <Bot color={Colors.light.tint} size={20} />
              <Text style={styles.headerTitle}>AI Assistant</Text>
            </View>
            <TouchableOpacity onPress={toggleExpanded} style={styles.headerButton}>
              <ChevronDown color={Colors.light.subtle} size={20} />
            </TouchableOpacity>
          </View>

          {/* AI Actions */}
          {contractData && (
            <View style={styles.aiActions}>
              <TouchableOpacity 
                onPress={handleFillWithAI} 
                style={styles.aiActionButton}
                testID="aiFillButton"
              >
                <Wand2 color={Colors.light.tint} size={16} />
                <Text style={styles.aiActionText}>Fill with AI</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowSourceEditor(!showSourceEditor)} 
                style={styles.aiActionButton}
                testID="editSourceButton"
              >
                <FileText color={Colors.light.tint} size={16} />
                <Text style={styles.aiActionText}>Edit Source</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Source Editor */}
          {showSourceEditor && contractData && (
            <View style={styles.sourceEditor}>
              <Text style={styles.sourceEditorLabel}>Source Document</Text>
              <TextInput
                style={styles.sourceInput}
                value={sourceText}
                onChangeText={setSourceText}
                multiline
                numberOfLines={8}
                placeholder="Paste or edit the source document here..."
                placeholderTextColor={Colors.light.subtle}
                testID="sourceTextInput"
              />
              <View style={styles.sourceActions}>
                <TouchableOpacity 
                  onPress={() => setShowSourceEditor(false)} 
                  style={styles.sourceActionButton}
                >
                  <Text style={styles.sourceActionText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleUpdateSource} 
                  style={[styles.sourceActionButton, styles.sourceActionButtonPrimary]}
                >
                  <Text style={styles.sourceActionTextPrimary}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Messages */}
          <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.role === 'user' ? styles.userMessageRow : styles.assistantMessageRow,
                ]}
              >
                <View style={styles.messageIcon}>
                  {message.role === 'user' ? (
                    <User color={Colors.light.subtle} size={16} />
                  ) : (
                    <Bot color={Colors.light.tint} size={16} />
                  )}
                </View>
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}
            
            {isTyping && (
              <View style={[styles.messageRow, styles.assistantMessageRow]}>
                <View style={styles.messageIcon}>
                  <Bot color={Colors.light.tint} size={16} />
                </View>
                <View style={[styles.messageBubble, styles.assistantMessage]}>
                  <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor={Colors.light.subtle}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              disabled={!inputText.trim()}
            >
              <Send color={inputText.trim() ? Colors.light.tint : Colors.light.subtle} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Floating Navbar */}
      <Animated.View style={[styles.navbar, { opacity: navbarOpacity }]}>
        <TouchableOpacity
          onPress={toggleExpanded}
          style={styles.navButton}
          testID="aiAssistantToggle"
        >
          <View style={styles.navButtonContent}>
            {isExpanded ? (
              <ChevronDown color={Colors.light.tint} size={20} />
            ) : (
              <>
                <Sparkles color={Colors.light.tint} size={18} />
                <Text style={styles.navButtonText}>AI Assistant</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} testID="voiceButton">
          <Mic color={Colors.light.subtle} size={18} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} testID="chatButton">
          <MessageSquare color={Colors.light.subtle} size={18} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  drawer: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  messageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: Colors.light.tint,
  },
  assistantMessage: {
    backgroundColor: Colors.light.surface,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: Colors.light.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.subtle,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.light.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.light.text,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '600',
  },
  aiActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  aiActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  aiActionText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '600',
  },
  sourceEditor: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sourceEditorLabel: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sourceInput: {
    backgroundColor: Colors.light.inputBg,
    borderRadius: 12,
    padding: 12,
    color: Colors.light.text,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
  },
  sourceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  sourceActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sourceActionButtonPrimary: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  sourceActionText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sourceActionTextPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});