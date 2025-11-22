import { generateText } from "@rork-ai/toolkit-sdk";
import React, { useState, useRef, useEffect, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  Alert,
  PanResponder,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
// Safe import handling for react-native-audio-record
let AudioRecord: any = null;
try {
  AudioRecord = require('react-native-audio-record').default;
} catch (error) {
  console.warn('react-native-audio-record not available, using fallback mode');
}
import VoiceEditModal from './VoiceEditModal';
import { captureException, addBreadcrumb } from '@/lib/sentry';

interface VoiceEditProps {
  children: ReactNode;
  value: string;
  onValueChange: (newValue: string) => void;
  fieldName?: string;
  enabled?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VoiceEdit({
  children,
  value,
  onValueChange,
  fieldName = 'field',
  enabled = true,
}: VoiceEditProps) {
  const [isLongPress, setIsLongPress] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [blurIntensity, setBlurIntensity] = useState<number>(0);
  const [webBlurOpacity, setWebBlurOpacity] = useState<number>(0);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize AudioRecord for real-time streaming (only if available)
  useEffect(() => {
    if (AudioRecord) {
      const options = {
        sampleRate: 16000,  // 16kHz for Scribe v2 Realtime
        channels: 1,        // Mono
        bitsPerSample: 16,  // 16-bit PCM
        audioSource: 6,     // VOICE_COMMUNICATION
        wavFile: undefined, // No file output, we want raw data
      };

      AudioRecord.init(options);
      console.log('VoiceEdit: AudioRecord initialized for real-time streaming');
    } else {
      console.log('VoiceEdit: AudioRecord not available, using fallback mode');
    }
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  useEffect(() => {
    Animated.spring(blurAnim, {
      toValue: isLongPress ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start(({ finished }) => {
      if (finished && isLongPress) {
        setBlurIntensity(80);
        setWebBlurOpacity(0.6);
      } else if (!isLongPress) {
        setBlurIntensity(0);
        setWebBlurOpacity(0);
      }
    });

    Animated.spring(modalAnim, {
      toValue: isLongPress ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [isLongPress, blurAnim, modalAnim]);

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
      if (isRecording && AudioRecord) {
        AudioRecord.stop();
      }
    };
  }, [isRecording]);

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

      console.log('VoiceEdit: Starting recording...');
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      setIsRecording(true);
      setTranscriptionText('Listening...');
      console.log('VoiceEdit: Recording started');
    } catch (err) {
      console.error('VoiceEdit: Failed to start recording', err);
      captureException(err instanceof Error ? err : new Error('Recording start failed'), {
        context: 'startRecording',
        fieldName,
        platform: Platform.OS,
      });
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      handleCancel();
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    console.log('VoiceEdit: Stopping recording...');
    setIsRecording(false);
    setIsProcessing(true);
    setTranscriptionText('Processing...');

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      console.log('VoiceEdit: Recording stopped at', uri);

      if (uri) {
        await transcribeAndEdit(uri);
      }
    } catch (error) {
      console.error('VoiceEdit: Failed to stop recording', error);
      captureException(error instanceof Error ? error : new Error('Recording stop failed'), {
        context: 'stopRecording',
        fieldName,
        audioUri: audioRecorder.uri,
      });
      Alert.alert('Error', 'Failed to process recording.');
      handleCancel();
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
        console.log('VoiceEdit: WebSocket connected to ElevenLabs ScribeV2 Realtime');
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
          console.error('VoiceEdit: Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('VoiceEdit: WebSocket error:', error);
        setConnectionState('error');
        clearTimeout(connectionTimeoutRef.current!);
        reject(error);
      };

      ws.onclose = (event) => {
        console.log('VoiceEdit: WebSocket closed:', event.code, event.reason);
        clearTimeout(connectionTimeoutRef.current!);
        websocketRef.current = null;
        setConnectionState('disconnected');

        // Attempt reconnection if we were recording and it's not a normal close
        if (isRecording && event.code !== 1000 && reconnectAttempts < 3) {
          console.log(`VoiceEdit: Attempting reconnection (${reconnectAttempts + 1}/3)...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(true).catch(err => {
              console.error('VoiceEdit: Reconnection failed:', err);
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
          console.log('VoiceEdit: ElevenLabs session started:', data);
          break;

        case 'partial_transcript':
          const partialText = data.text || '';
          if (partialText.trim()) {
            setTranscriptionText(partialText);
            console.log('VoiceEdit: Partial transcript:', partialText);
          }
          break;

        case 'committed_transcript':
          const committedText = data.text || '';
          console.log('VoiceEdit: Committed transcript:', committedText);
          if (committedText.trim()) {
            setTranscriptionText(committedText);
            // Auto-accept the transcription for VoiceEdit
            handleAccept(committedText);
          }
          break;

        case 'error':
        case 'auth_error':
          console.error('VoiceEdit: ElevenLabs authentication error:', data);
          Alert.alert('Authentication Error', 'Please check your ElevenLabs API key configuration.');
          handleCancel();
          break;

        case 'quota_exceeded':
          console.error('VoiceEdit: ElevenLabs quota exceeded:', data);
          Alert.alert('Quota Exceeded', 'You have exceeded your ElevenLabs API quota. Please check your usage limits.');
          handleCancel();
          break;

        case 'transcriber_error':
          console.error('VoiceEdit: ElevenLabs transcription error:', data);
          Alert.alert('Transcription Error', 'Unable to transcribe audio. Please try again.');
          handleCancel();
          break;

        case 'input_error':
          console.error('VoiceEdit: ElevenLabs input error:', data);
          Alert.alert('Audio Error', 'Invalid audio format. Please check your microphone settings.');
          handleCancel();
          break;

        default:
          console.log('VoiceEdit: Unknown message type:', data.message_type, data);
      }
    } catch (error) {
      console.error('VoiceEdit: Error handling WebSocket message:', error);
    }
  };

  const transcribeAndEdit = async (uri: string) => {
    try {
      console.log('VoiceEdit: Starting real-time transcription');
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
        console.log('VoiceEdit: WebSocket connected successfully');
      } catch (wsError) {
        console.warn('VoiceEdit: WebSocket connection failed, falling back to file-based transcription:', wsError);
        wsConnected = false;
      }

      if (wsConnected && AudioRecord) {
        // Use real-time streaming
        console.log('VoiceEdit: Starting real-time audio streaming');

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
              console.error('VoiceEdit: Error sending audio chunk:', error);
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
          if (AudioRecord) {
            AudioRecord.stop();
          }
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
        console.log('VoiceEdit: Using fallback transcription with regular ScribeV2 API');
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
          console.error('VoiceEdit: STT error:', sttResponse.status, errorText);

          if (sttResponse.status === 429) {
            Alert.alert('Rate Limit', 'Too many requests. Please wait a moment and try again.');
            handleCancel();
            return;
          }

          throw new Error(`Transcription failed: ${sttResponse.status}`);
        }

        const responseText = await sttResponse.text();
        console.log('VoiceEdit: Raw response:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('VoiceEdit: Failed to parse JSON:', parseError);
          throw new Error('Invalid response from transcription service');
        }

        console.log('VoiceEdit: Parsed response:', data);

        if (data && data.text) {
          const transcription = data.text.trim();
          console.log('VoiceEdit: Transcription result:', transcription);

          if (transcription === '') {
            console.warn('VoiceEdit: Received empty transcription');
            Alert.alert('No Speech Detected', 'No speech was detected in the recording. Please try again.');
            handleCancel();
            return;
          }

          setTranscriptionText(transcription);
          // Auto-accept for VoiceEdit (no modal needed)
          handleAccept(transcription);
        } else {
          console.error('VoiceEdit: No text field in response');
          throw new Error('No transcription text received');
        }
      }
    } catch (error) {
      console.error('VoiceEdit: Transcription error:', error);
      captureException(error instanceof Error ? error : new Error('Transcription failed'), {
        context: 'transcribeAndEdit',
        fieldName,
        audioUri: uri,
      });
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
      handleCancel();
    }
  };

  const handleAccept = async (transcription: string) => {
    try {
      setIsProcessing(true);
      const updatedValue = await processSmartEdit(value, transcription, fieldName);
      onValueChange(updatedValue);
      handleCancel();
    } catch (error) {
      console.error('VoiceEdit: Failed to process edit:', error);
      Alert.alert('Error', 'Failed to process voice edit. Please try again.');
      handleCancel();
    }
  };

  const processSmartEdit = async (currentValue: string, spokenText: string, field: string): Promise<string> => {
    try {
      const prompt = `
You are a smart text editing assistant.
Current text in field "${field}": "${currentValue}"
User instruction/spoken text: "${spokenText}"

Task: Update the text based on the user's instruction.
Rules:
1. If the user says "clear" or "delete", return an empty string.
2. If the user provides new content, replace or append as appropriate based on context.
3. If the user says "change X to Y", perform the replacement.
4. Return ONLY the final text. No explanations.
`;

      const result = await generateText({
        messages: [{ role: 'user', content: prompt }]
      });
      
      return result.trim();
    } catch (error) {
      console.error('Smart edit failed, falling back to basic logic', error);
      // Fallback logic
      const lowerSpoken = spokenText.toLowerCase();
      if (lowerSpoken.includes('clear') || lowerSpoken.includes('delete')) return '';
      if (lowerSpoken.includes('append') || lowerSpoken.includes('add')) return `${currentValue} ${spokenText}`.trim();
      return spokenText;
    }
  };

  const handleCancel = () => {
    setIsLongPress(false);
    setIsRecording(false);
    setIsProcessing(false);
    setTranscriptionText('');
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        touchPositionRef.current = { x: pageX, y: pageY };
        
        let modalX = pageX;
        let modalY = pageY - 150;
        
        if (modalX < 20) modalX = 20;
        if (modalX > SCREEN_WIDTH - 320) modalX = SCREEN_WIDTH - 320;
        if (modalY < 60) modalY = pageY + 60;
        if (modalY > SCREEN_HEIGHT - 200) modalY = pageY - 200;
        
        setModalPosition({ x: modalX, y: modalY });

        pressTimerRef.current = setTimeout(() => {
          console.log('VoiceEdit: Long press detected (2 seconds)');
          setIsLongPress(true);
          startRecording();
        }, 2000);
      },
      onPanResponderRelease: () => {
        if (pressTimerRef.current) {
          clearTimeout(pressTimerRef.current);
          pressTimerRef.current = null;
        }

        if (isLongPress && isRecording) {
          stopRecording();
        } else if (isLongPress && !isRecording && !isProcessing) {
          handleCancel();
        }
      },
      onPanResponderTerminate: () => {
        if (pressTimerRef.current) {
          clearTimeout(pressTimerRef.current);
          pressTimerRef.current = null;
        }
        handleCancel();
      },
    })
  ).current;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.4],
  });

  return (
    <>
      {isLongPress && Platform.OS !== 'web' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <BlurView intensity={blurIntensity} style={StyleSheet.absoluteFill} tint="dark" />
        </View>
      )}
      
      {isLongPress && Platform.OS === 'web' && (
        <View 
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: `rgba(0, 0, 0, ${webBlurOpacity})`,
            }
          ]} 
          pointerEvents="none"
        />
      )}

      <View style={styles.wrapper} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.glowContainer,
            {
              opacity: enabled ? glowOpacity : 0,
            },
          ]}
        >
          {children}
        </Animated.View>
      </View>

      <VoiceEditModal
        visible={isLongPress}
        position={modalPosition}
        transcriptionText={transcriptionText}
        isRecording={isRecording}
        isProcessing={isProcessing}
        animatedValue={modalAnim}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative' as const,
  },
  glowContainer: {
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))',
      },
    }),
  },
});
