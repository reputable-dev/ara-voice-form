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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
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
  Camera,
  ImageIcon,
  X,
} from 'lucide-react-native';
import { ContractFormData } from '@/types/contract';
import { captureException, addBreadcrumb } from '@/lib/sentry';

interface MessageImage {
  uri: string;
  base64?: string;
  mimeType: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: MessageImage[];
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
  const [selectedImages, setSelectedImages] = useState<MessageImage[]>([]);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
  
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
      console.error('FloatingAIAssistant: Fill form error', error);
      captureException(error instanceof Error ? error : new Error('Fill form failed'), {
        context: 'handleFillWithAI',
        sourceText: sourceText?.slice(0, 200),
      });
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

  const callGeminiAPI = useCallback(async (messages: Message[]): Promise<string> => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not configured. Please add it to your .env file.');
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
      
      // Convert messages to Gemini format
      const geminiMessages = messages.map(msg => {
        const parts: any[] = [];
        
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        
        if (msg.images && msg.images.length > 0) {
          msg.images.forEach(img => {
            if (img.base64) {
              parts.push({
                inline_data: {
                  mime_type: img.mimeType,
                  data: img.base64
                }
              });
            }
          });
        }
        
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        };
      });
      
      const requestBody = {
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };
      
      console.log('Sending request to Gemini API:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Gemini API error:', response.status, responseText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid JSON response from API');
      }
      console.log('Gemini API response:', JSON.stringify(data, null, 2));
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      captureException(error instanceof Error ? error : new Error('Gemini API call failed'), {
        context: 'callGeminiAPI',
        messageCount: messages.length,
        apiEndpoint: 'generativelanguage.googleapis.com',
      });
      throw error;
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() && selectedImages.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      images: selectedImages.length > 0 ? selectedImages : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedImages([]);
    setIsTyping(true);

    try {
      // Get conversation history for context
      const conversationHistory = [...messages, userMessage];
      
      // Add system context if this is a contract page
      if (contractData) {
        const systemMessage: Message = {
          id: 'system',
          role: 'user',
          content: `You are an AI assistant helping with contract forms and document parsing. The user has access to a "Fill with AI" feature and can edit source documents. Current source document: ${sourceText || 'No source document provided'}. Please provide helpful, accurate assistance with contract-related tasks.`,
          timestamp: new Date(),
        };
        conversationHistory.unshift(systemMessage);
      }
      
      const aiResponseText = await callGeminiAPI(conversationHistory);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      captureException(error instanceof Error ? error : new Error('AI response failed'), {
        context: 'sendMessage',
        hasContractData: !!contractData,
        messageLength: inputText.length,
        imageCount: selectedImages.length,
      });
      addBreadcrumb('AI message send failed', 'error', {
        inputLength: inputText.length,
        hasImages: selectedImages.length > 0,
      });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting to my AI service right now. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, selectedImages, messages, contractData, sourceText, callGeminiAPI]);

  const pickImage = useCallback(async (useCamera: boolean = false) => {
    try {
      setIsLoadingImage(true);
      
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageData: MessageImage = {
          uri: asset.uri,
          base64: asset.base64 || undefined,
          mimeType: asset.mimeType || 'image/jpeg',
        };
        setSelectedImages(prev => [...prev, imageData]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsLoadingImage(false);
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

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
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                  ]}
                >
                  {message.images && message.images.length > 0 && (
                    <View style={styles.messageImages}>
                      {message.images.map((img, index) => (
                        <Image
                          key={index}
                          source={{ uri: img.uri }}
                          style={styles.messageImage}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  )}
                  {message.content && (
                    <Text
                      style={[
                        styles.messageText,
                        message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            
            {isTyping && (
              <View style={[styles.messageRow, styles.assistantMessageRow]}>
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
            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <View style={styles.selectedImagesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedImages.map((img, index) => (
                    <View key={index} style={styles.selectedImageWrapper}>
                      <Image source={{ uri: img.uri }} style={styles.selectedImage} />
                      <TouchableOpacity
                        onPress={() => removeImage(index)}
                        style={styles.removeImageButton}
                      >
                        <X color="#FFFFFF" size={12} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.inputRow}>
              <View style={styles.inputActions}>
                <TouchableOpacity
                  onPress={() => pickImage(true)}
                  style={styles.inputActionButton}
                  disabled={isLoadingImage}
                >
                  <Camera color={Colors.light.subtle} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickImage(false)}
                  style={styles.inputActionButton}
                  disabled={isLoadingImage}
                >
                  <ImageIcon color={Colors.light.subtle} size={18} />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor={Colors.light.subtle}
                multiline
                maxLength={500}
              />
              
              <TouchableOpacity
                onPress={sendMessage}
                style={[
                  styles.sendButton,
                  (!inputText.trim() && selectedImages.length === 0) && styles.sendButtonDisabled
                ]}
                disabled={!inputText.trim() && selectedImages.length === 0}
                testID="ai-send-button"
              >
                <Send 
                  color={(inputText.trim() || selectedImages.length > 0) ? Colors.light.tint : Colors.light.subtle} 
                  size={18} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Floating Navbar */}
      <Animated.View style={[styles.navbar, { opacity: navbarOpacity }]}>
        <TouchableOpacity
          onPress={toggleExpanded}
          style={styles.navButton}
          testID="ai-assistant-toggle"
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  selectedImagesContainer: {
    marginBottom: 12,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 4,
  },
  inputActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
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
  messageImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  messageImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
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