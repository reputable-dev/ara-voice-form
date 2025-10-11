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
  Alert,
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
  Square,
  Loader,
} from 'lucide-react-native';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';

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
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const insets = useSafeAreaInsets();
  
  const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: isChatOpen ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [isChatOpen, heightAnim]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

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

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
        return;
      }

      console.log('Starting recording...');
      await audioRecorder.record();
      setIsRecording(true);
      setStreamingText('');
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    console.log('Stopping recording...');
    setIsRecording(false);
    setIsProcessing(true);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      console.log('Recording stopped and stored at', uri);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to process recording.');
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
      console.log('Transcribing audio from:', uri);

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('audio', blob, 'recording.webm');
      } else {
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        const audioFile = {
          uri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        } as any;

        formData.append('audio', audioFile);
      }

      const sttResponse = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!sttResponse.ok) {
        const errorText = await sttResponse.text();
        console.error('STT API error:', sttResponse.status, errorText);
        throw new Error(`Transcription failed: ${sttResponse.status}`);
      }

      const data = await sttResponse.json();
      console.log('Transcription result:', data);

      if (data.text) {
        setMessages(prev => [...prev, { role: 'user', content: data.text }]);
        setStreamingText('');
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "I've received your message. How can I help you with that?" 
          }]);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, 1000);
      } else {
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
        style={[styles.iconButton, isRecording && styles.recordingButton]}
        onPress={handleMicPress}
        disabled={isProcessing}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          {isProcessing ? (
            <Loader color="#F97316" size={22} />
          ) : isRecording ? (
            <Square color="#EF4444" size={22} fill="#EF4444" />
          ) : (
            <Mic color="#F97316" size={22} />
          )}
        </Animated.View>
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
                {(isRecording || isProcessing) && (
                  <View style={styles.streamingContainer}>
                    <View style={styles.streamingIndicator}>
                      {isRecording && (
                        <View style={styles.recordingDot} />
                      )}
                      <Text style={styles.streamingText}>
                        {isProcessing ? 'Processing...' : 'Recording...'}
                      </Text>
                    </View>
                  </View>
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
  recordingButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  streamingContainer: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  streamingText: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
