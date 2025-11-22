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
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Home, 
  ClipboardList, 
  Calendar, 
  Users,
  Send,
  Mic,
  X,
  Paperclip,
  Square,
  Loader,
  MessageCircle,
} from 'lucide-react-native';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import AudioRecord from 'react-native-audio-record';
import { ContractFormData } from '@/types/contract';

interface ContractData {
  source: string;
  formData: ContractFormData;
  onFillAI: () => void;
  onUpdateSource: (newSource: string) => void;
  onVoiceFillComplete?: (transcription: string) => void;
}

interface FloatingAINavbarProps {
  visible?: boolean;
  contractData?: ContractData;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 70;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.5;

export default function FloatingAINavbar({ visible = true, contractData }: FloatingAINavbarProps) {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! How can I assist you today?' }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('home');
   const [isRecording, setIsRecording] = useState<boolean>(false);
   const [isProcessing, setIsProcessing] = useState<boolean>(false);
   const [transcriptionText, setTranscriptionText] = useState<string>('');
   const [isVoiceUIVisible, setIsVoiceUIVisible] = useState<boolean>(false);
   const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
   const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
   const insets = useSafeAreaInsets();
  
   const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
   const inputRef = useRef<TextInput>(null);
   const scrollViewRef = useRef<ScrollView>(null);
   const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
   const websocketRef = useRef<WebSocket | null>(null);
   const audioStreamRef = useRef<any>(null);
   const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const pulseAnim = useRef(new Animated.Value(1)).current;
   const voiceUIAnim = useRef(new Animated.Value(0)).current;
   const waveAnims = useRef([
     new Animated.Value(0.3),
     new Animated.Value(0.5),
     new Animated.Value(0.7),
     new Animated.Value(0.9),
     new Animated.Value(0.7),
     new Animated.Value(0.5),
     new Animated.Value(0.3),
   ]).current;

   // Initialize AudioRecord for real-time streaming
   useEffect(() => {
     const options = {
       sampleRate: 16000,  // 16kHz for Scribe v2 Realtime
       channels: 1,        // Mono
       bitsPerSample: 16,  // 16-bit PCM
       audioSource: 6,     // VOICE_COMMUNICATION
       wavFile: undefined, // No file output, we want raw data
     };

     AudioRecord.init(options);
     console.log('FloatingAINavbar: AudioRecord initialized for real-time streaming');
   }, []);

   useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: isChatOpen ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [isChatOpen, heightAnim]);

  useEffect(() => {
    Animated.spring(voiceUIAnim, {
      toValue: isVoiceUIVisible ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [isVoiceUIVisible, voiceUIAnim]);

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

      waveAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 400 + index * 100,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 400 + index * 100,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      pulseAnim.setValue(1);
      waveAnims.forEach(anim => anim.setValue(0.3));
    }
  }, [isRecording, pulseAnim, waveAnims]);

  // Cleanup effect for WebSocket and audio resources
  useEffect(() => {
    return () => {
      // Clean up WebSocket
      if (websocketRef.current) {
        websocketRef.current.close();
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.remove();
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }

      // Stop recording if active
      if (isRecording) {
        AudioRecord.stop();
      }
    };
  }, [isRecording]);

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

      if (Platform.OS === 'ios') {
        await AudioModule.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      }

      console.log('Preparing to record...');
      await audioRecorder.prepareToRecordAsync();
      
      console.log('Starting recording...');
      await audioRecorder.record();
      setIsRecording(true);
      setTranscriptionText('Listening...');
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async (doFinalAnalysis = true) => {
    if (!isRecording) return;

    console.log('Stopping recording...');
    setIsRecording(false);
    setIsProcessing(true);
    setTranscriptionText('Processing...');

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      console.log('Recording stopped and stored at', uri);

      if (uri) {
        await transcribeAudio(uri, doFinalAnalysis);
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to process recording.');
      setIsProcessing(false);
      setTranscriptionText('');
    }
  };

   const connectWebSocket = async (isReconnect = false): Promise<WebSocket> => {
     const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
     if (!apiKey) {
       throw new Error('EXPO_PUBLIC_ELEVENLABS_API_KEY is not configured. Please add it to your .env file.');
     }

     if (isReconnect) {
       setReconnectAttempts(prev => prev + 1);
     } else {
       setReconnectAttempts(0);
     }

     setConnectionState('connecting');

     // Clean up existing connection
     if (websocketRef.current) {
       websocketRef.current.close();
       websocketRef.current = null;
     }

     const wsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&audio_format=pcm_16000&include_timestamps=false`;

     return new Promise<WebSocket>((resolve, reject) => {
       const ws = new WebSocket(wsUrl, [], {
         headers: {
           'xi-api-key': apiKey,
         },
       });

       // Connection timeout (10 seconds)
       connectionTimeoutRef.current = setTimeout(() => {
         ws.close();
         reject(new Error('WebSocket connection timeout'));
       }, 10000);

       ws.onopen = () => {
         console.log('FloatingAINavbar: WebSocket connected to ElevenLabs ScribeV2 Realtime');
         clearTimeout(connectionTimeoutRef.current!);
         setConnectionState('connected');
         setReconnectAttempts(0);
         websocketRef.current = ws;
         resolve(ws);
       };

       ws.onmessage = (event) => {
         try {
           const data = JSON.parse(event.data);
           handleWebSocketMessage(data);
         } catch (error) {
           console.error('FloatingAINavbar: Failed to parse WebSocket message:', error);
         }
       };

       ws.onerror = (error) => {
         console.error('FloatingAINavbar: WebSocket error:', error);
         setConnectionState('error');
         clearTimeout(connectionTimeoutRef.current!);
         reject(error);
       };

       ws.onclose = (event) => {
         console.log('FloatingAINavbar: WebSocket closed:', event.code, event.reason);
         clearTimeout(connectionTimeoutRef.current!);
         websocketRef.current = null;
         setConnectionState('disconnected');

         // Attempt reconnection if we were recording and it's not a normal close
         if (isRecording && event.code !== 1000 && reconnectAttempts < 3) {
           console.log(`FloatingAINavbar: Attempting reconnection (${reconnectAttempts + 1}/3)...`);
           reconnectTimeoutRef.current = setTimeout(() => {
             connectWebSocket(true).catch(err => {
               console.error('FloatingAINavbar: Reconnection failed:', err);
             });
           }, Math.min(1000 * Math.pow(2, reconnectAttempts), 5000)); // Exponential backoff
         }
       };
     });
   };

   const handleWebSocketMessage = (data: any) => {
     try {
       switch (data.message_type) {
         case 'session_started':
           console.log('FloatingAINavbar: ElevenLabs session started:', data);
           break;

         case 'partial_transcript':
           const partialText = data.text || '';
           if (partialText.trim()) {
             setTranscriptionText(partialText);
             console.log('FloatingAINavbar: Partial transcript:', partialText);
           }
           break;

         case 'committed_transcript':
           const committedText = data.text || '';
           console.log('FloatingAINavbar: Committed transcript:', committedText);
           if (committedText.trim()) {
             setTranscriptionText(committedText);
             // Send the transcribed text as a message
             handleSendMessage(committedText);
           }
           break;

         case 'error':
         case 'auth_error':
           console.error('FloatingAINavbar: ElevenLabs authentication error:', data);
           Alert.alert('Authentication Error', 'Please check your ElevenLabs API key configuration.');
           stopRecording();
           break;

         case 'quota_exceeded':
           console.error('FloatingAINavbar: ElevenLabs quota exceeded:', data);
           Alert.alert('Quota Exceeded', 'You have exceeded your ElevenLabs API quota. Please check your usage limits.');
           stopRecording();
           break;

         case 'transcriber_error':
           console.error('FloatingAINavbar: ElevenLabs transcription error:', data);
           Alert.alert('Transcription Error', 'Unable to transcribe audio. Please try again.');
           stopRecording();
           break;

         case 'input_error':
           console.error('FloatingAINavbar: ElevenLabs input error:', data);
           Alert.alert('Audio Error', 'Invalid audio format. Please check your microphone settings.');
           stopRecording();
           break;

         default:
           console.log('FloatingAINavbar: Unknown message type:', data.message_type, data);
       }
     } catch (error) {
       console.error('FloatingAINavbar: Error handling WebSocket message:', error);
     }
   };

   const transcribeAudio = async (uri: string, doFinalAnalysis: boolean) => {
    try {
      console.log('FloatingAINavbar: Starting real-time transcription');
      setTranscriptionText('Connecting...');

      // Try to connect to ElevenLabs WebSocket with timeout
      let wsConnected = false;
      try {
        await Promise.race([
          connectWebSocket(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('WebSocket connection timeout')), 8000)
          )
        ]);
        wsConnected = true;
        console.log('FloatingAINavbar: WebSocket connected successfully');
      } catch (wsError) {
        console.warn('FloatingAINavbar: WebSocket connection failed, falling back to file-based transcription:', wsError);
        wsConnected = false;
      }

      if (wsConnected) {
        // Use real-time streaming
        console.log('FloatingAINavbar: Starting real-time audio streaming');

        // Start AudioRecord for real-time streaming
        AudioRecord.start();

        // Set up audio data listener
        audioStreamRef.current = AudioRecord.on('data', (data: any) => {
          if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            try {
              // Convert audio data to base64 and send to WebSocket
              const base64Audio = data.toString('base64');
              websocketRef.current.send(JSON.stringify({
                message_type: 'input_audio_chunk',
                audio_base_64: base64Audio,
                commit: false,
                sample_rate: 16000,
              }));
            } catch (error) {
              console.error('FloatingAINavbar: Error sending audio chunk:', error);
            }
          }
        });

        // Wait for transcription to complete or timeout
        setTimeout(async () => {
          if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify({
              message_type: 'input_audio_chunk',
              audio_base_64: '',
              commit: true,
              sample_rate: 16000,
            }));
          }

          // Stop recording and close connection
          AudioRecord.stop();
          if (audioStreamRef.current) {
            audioStreamRef.current.remove();
            audioStreamRef.current = null;
          }

          setTimeout(() => {
            if (websocketRef.current) {
              websocketRef.current.close();
            }
            setIsProcessing(false);
          }, 2000);
        }, 10000); // Record for 10 seconds max

      } else {
        // Fallback to regular ScribeV2 API
        console.log('FloatingAINavbar: Using fallback transcription with regular ScribeV2 API');
        setTranscriptionText('Transcribing...');

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

        const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
        if (!apiKey) {
          throw new Error('EXPO_PUBLIC_ELEVENLABS_API_KEY is not configured. Please add it to your .env file.');
        }

        const sttResponse = await fetch('https://api.elevenlabs.io/v1/scribe', {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
          },
          body: formData,
        });

        if (!sttResponse.ok) {
          const errorText = await sttResponse.text();
          console.error('FloatingAINavbar: STT API error:', sttResponse.status, errorText);

          if (sttResponse.status === 429) {
            Alert.alert('Rate Limit', 'Too many requests. Please wait a moment and try again.');
            setIsProcessing(false);
            setTranscriptionText('');
            return;
          }

          throw new Error(`Transcription failed: ${sttResponse.status}`);
        }

        const responseText = await sttResponse.text();
        console.log('FloatingAINavbar: STT API response:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('FloatingAINavbar: Failed to parse JSON response:', parseError);
          console.error('Response text:', responseText);
          throw new Error('Invalid response from transcription service');
        }

        console.log('FloatingAINavbar: Transcription result:', data);

        if (data && data.text !== undefined) {
          if (data.text.trim() === '') {
            console.warn('FloatingAINavbar: Received empty transcription text');
            Alert.alert('No Speech Detected', 'No speech was detected in the recording. Please try again.');
          } else {
            setTranscriptionText(data.text);
            // Send the transcribed text as a message
            handleSendMessage(data.text);
          }
        } else {
          console.error('FloatingAINavbar: No text field in response. Keys:', Object.keys(data));
          console.error('Entire response:', JSON.stringify(data, null, 2));
          throw new Error('No transcription text received');
        }
      }
    } catch (error) {
      console.error('FloatingAINavbar: Error transcribing audio:', error);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
      setTranscriptionText('');
    }
  };

  const handleVoicePressIn = () => {
    isLongPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsVoiceUIVisible(true);
      startRecording();
    }, 200);
  };

  const handleVoicePressOut = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isLongPressRef.current && isRecording) {
      stopRecording(true);
    }
  };

  const handleVoiceTap = () => {
    if (isRecording) {
      stopRecording(true);
    } else {
      setIsVoiceUIVisible(true);
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
      <Pressable
        style={[
          styles.iconButton, 
          styles.botButton,
          (isRecording || isVoiceUIVisible) && styles.voiceFillActive
        ]}
        onPressIn={handleVoicePressIn}
        onPressOut={handleVoicePressOut}
        onPress={handleVoiceTap}
        disabled={isProcessing}
      >
        <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
          {isProcessing ? (
            <Loader color="#10B981" size={24} />
          ) : isRecording ? (
            <Square color="#EF4444" size={24} fill="#EF4444" />
          ) : (
            <Mic color={(isRecording || isVoiceUIVisible) ? "#EF4444" : "#10B981"} size={24} />
          )}
        </Animated.View>
      </Pressable>
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
        <View style={styles.sendButtonContent}>
          <Send color="#10B981" size={18} />
          <Text style={styles.sendText}>Send</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, isRecording && styles.recordingButton]}
        onPress={() => {}}
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
      {isChatOpen ? (
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
      ) : null}

      {isVoiceUIVisible && (
        <Animated.View
          style={[
            styles.voiceUIContainer,
            {
              bottom: insets.bottom + 100,
              opacity: voiceUIAnim,
              transform: [{
                translateY: voiceUIAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.voiceUI}>
            {isRecording && (
              <View style={styles.waveContainer}>
                {waveAnims.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveBar,
                      {
                        transform: [{ scaleY: anim }],
                      },
                    ]}
                  />
                ))}
              </View>
            )}
            
            {transcriptionText && (
              <View style={styles.transcriptionContainer}>
                <Text style={styles.transcriptionText}>{transcriptionText}</Text>
              </View>
            )}
            
            <Text style={styles.voiceStatusText}>
              {isProcessing
                ? 'Processing...'
                : isRecording
                ? 'Recording... Tap to stop or release'
                : 'Hold to record'}
            </Text>
          </View>
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
          {isChatOpen ? (
            <View style={styles.chatContainer}>
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                  <MessageCircle color="#10B981" size={24} />
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
                      {isRecording && <View style={styles.recordingDot} />}
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
          ) : null}

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
  voiceFillActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    width: 'auto',
    height: 'auto',
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginBottom: 12,
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
    marginBottom: 12,
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
  voiceUIContainer: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  voiceUI: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 4px 24px rgba(16, 185, 129, 0.3)',
      },
    }),
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 4,
    marginBottom: 16,
  },
  waveBar: {
    width: 4,
    height: 40,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  transcriptionContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    minHeight: 60,
  },
  transcriptionText: {
    color: '#D1FAE5',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  voiceStatusText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
});
