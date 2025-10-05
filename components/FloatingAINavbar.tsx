import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  TextInput,
  Platform,
  ScrollView,
  useWindowDimensions,
  Alert,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { Send, X, MessageSquare, Home, FileCog, MoreHorizontal, Sparkles, Wand2, FileText, Camera, ImageIcon, Bot } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { ContractFormData } from '@/types/contract';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: contractData 
        ? 'Hi! I\'m ARA, your AI assistant. I can help you fill out contract forms, parse source documents, and answer questions. How can I assist you today?'
        : 'Hi! I\'m ARA, your AI assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [sourceText, setSourceText] = useState(contractData?.source || '');
  const [showSourceEditor, setShowSourceEditor] = useState(false);
  const [selectedImages, setSelectedImages] = useState<MessageImage[]>([]);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { height: screenHeight } = useWindowDimensions();
  
  console.log('FloatingAINavbar - Current pathname:', pathname);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const callGeminiAPI = useCallback(async (messages: Message[]): Promise<string> => {
    try {
      const apiKey = 'AIzaSyCC5LnBazvUeGJrg-QDQMB7bp64FV5DMVk';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
      
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
      };
      
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
      
      const data = JSON.parse(responseText);
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
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
      const conversationHistory = [...messages, userMessage];
      
      if (contractData) {
        const systemMessage: Message = {
          id: 'system',
          role: 'user',
          content: `You are an AI assistant helping with contract forms and document parsing. Current source document: ${sourceText || 'No source document provided'}. Please provide helpful, accurate assistance with contract-related tasks.`,
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
    outputRange: [0, screenHeight * 0.65],
  });

  const navbarOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });

  if (!visible) return null;

  return (
    <View style={[styles.mainContainer, { paddingBottom: insets.bottom }]}>
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

      {/* Expanded Drawer */}
      <Animated.View
        style={[
          styles.expandedContainer,
          {
            height: drawerHeight,
            transform: [{ translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [screenHeight * 0.65, 0],
            })}],
          },
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        {Platform.OS === 'ios' ? (
          <View style={[styles.expandedBlur, styles.androidBlur]}>
            <View style={styles.expandedContent}>
              <View style={styles.expandedHeader}>
                <View style={styles.headerLeft}>
                  <View>
                    <Text style={styles.headerTitle}>ARA</Text>
                    <Text style={styles.headerSubtitle}>Ask me anything</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={toggleExpanded} style={styles.closeButton}>
                  <X size={18} color={Colors.light.subtle} />
                </TouchableOpacity>
              </View>

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

              <View style={styles.inputContainer}>
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
                    placeholder="Ask me anything..."
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
                  >
                    <Send 
                      color={(inputText.trim() || selectedImages.length > 0) ? Colors.light.tint : Colors.light.subtle} 
                      size={18} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.expandedBlur, styles.androidBlur]}>
            <View style={styles.expandedContent}>
              <View style={styles.expandedHeader}>
                <View style={styles.headerLeft}>
                  <View>
                    <Text style={styles.headerTitle}>ARA</Text>
                    <Text style={styles.headerSubtitle}>Ask me anything</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={toggleExpanded} style={styles.closeButton}>
                  <X size={18} color={Colors.light.subtle} />
                </TouchableOpacity>
              </View>

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

              <View style={styles.inputContainer}>
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
                    placeholder="Ask me anything..."
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
                  >
                    <Send 
                      color={(inputText.trim() || selectedImages.length > 0) ? Colors.light.tint : Colors.light.subtle} 
                      size={18} 
                    />
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
            opacity: navbarOpacity,
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} style={styles.navbarBlur}>
            <View style={styles.navbarContent}>
              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {
                  if (isExpanded) {
                    toggleExpanded();
                  }
                  try {
                    router.replace('/dashboard');
                  } catch (error) {
                    console.error('Navigation error to dashboard:', error);
                  }
                }}
                testID="homeTab"
              >
                {isExpanded ? (
                  <Bot size={24} color={Colors.light.tint} />
                ) : (
                  <Home size={24} color={pathname === '/dashboard' ? Colors.light.tint : Colors.light.subtle} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {
                  if (isExpanded) {
                    toggleExpanded();
                  }
                  try {
                    router.replace('/contract');
                  } catch (error) {
                    console.error('Navigation error to contract:', error);
                  }
                }}
                testID="contractTab"
              >
                {isExpanded ? (
                  <Bot size={24} color={Colors.light.tint} />
                ) : (
                  <FileCog size={24} color={pathname === '/contract' ? Colors.light.tint : Colors.light.subtle} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centralAIButton}
                onPress={toggleExpanded}
                testID="aiAssistantButton"
              >
                {isExpanded ? (
                  <X size={24} color={Colors.light.tint} />
                ) : (
                  <Sparkles size={24} color={Colors.light.tint} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {
                  if (isExpanded) {
                    toggleExpanded();
                  }
                  try {
                    router.replace('/');
                  } catch (error) {
                    console.error('Navigation error to assistant:', error);
                  }
                }}
                testID="assistantTab"
              >
                {isExpanded ? (
                  <Bot size={24} color={Colors.light.tint} />
                ) : (
                  <MessageSquare size={24} color={pathname === '/' ? Colors.light.tint : Colors.light.subtle} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {
                  if (isExpanded) {
                    toggleExpanded();
                  }
                }}
                testID="moreTab"
              >
                {isExpanded ? (
                  <Bot size={24} color={Colors.light.tint} />
                ) : (
                  <MoreHorizontal size={24} color={Colors.light.subtle} />
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        ) : (
          <View style={[styles.navbarBlur, styles.androidBlur]}>
            <View style={styles.navbarContent}>
              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {
                  if (isExpanded) {
                    toggleExpanded();
                  }
                  try {
                    router.replace('/dashboard');
                  } catch (error) {
                    console.error('Navigation error to dashboard:', error);
                  }
                }}
                testID="homeTab"
              >
                {isExpanded ? (
                  <Bot size={24} color={Colors.light.tint} />
                ) : (
                  <Home size={24} color={pathname === '/dashboard' ? Colors.light.tint : Colors.light.subtle} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {
                  if (isExpanded) {
                    toggleExpanded();
                  }
                  try {
                    router.replace('/contract');
                  } catch (error) {
                    console.error('Navigation error to contract:', error);
                  }
                }}
                testID="contractTab"
              >
                {isExpanded ? (
                  <Bot size={24} color={Colors.light.tint} />
                ) : (
                  <FileCog size={24} color={pathname === '/contract' ? Colors.light.tint : Colors.light.subtle} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centralAIButton}
                onPress={toggleExpanded}
                testID="aiAssistantButton"
              >
                {isExpanded ? (
                  <X size={24} color={Colors.light.tint} />
                ) : (
                  <Sparkles size={24} color={Colors.light.tint} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {
                  if (isExpanded) {
                    toggleExpanded();
                  }
                  try {
                    router.replace('/');
                  } catch (error) {
                    console.error('Navigation error to assistant:', error);
                  }
                }}
                testID="assistantTab"
              >
                {isExpanded ? (
                  <Bot size={24} color={Colors.light.tint} />
                ) : (
                  <MessageSquare size={24} color={pathname === '/' ? Colors.light.tint : Colors.light.subtle} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarButton}
                onPress={() => {
                  if (isExpanded) {
                    toggleExpanded();
                  }
                }}
                testID="moreTab"
              >
                {isExpanded ? (
                  <Bot size={24} color={Colors.light.tint} />
                ) : (
                  <MoreHorizontal size={24} color={Colors.light.subtle} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -100,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },
  backdropTouchable: {
    flex: 1,
  },
  expandedContainer: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
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
  expandedBlur: {
    flex: 1,
    borderRadius: 16,
  },
  androidBlur: {
    backgroundColor: '#000000',
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
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.subtle,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  aiActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
    fontWeight: '600' as const,
  },
  sourceEditor: {
    marginBottom: 16,
  },
  sourceEditorLabel: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  sourceInput: {
    backgroundColor: Colors.light.inputBg,
    borderRadius: 12,
    padding: 12,
    color: Colors.light.text,
    fontSize: 13,
    textAlignVertical: 'top' as const,
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
    fontWeight: '600' as const,
  },
  sourceActionTextPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 16,
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
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
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
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
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
});
