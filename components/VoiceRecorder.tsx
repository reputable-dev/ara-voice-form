import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { Mic, Square, Loader } from 'lucide-react-native';
import Colors from '@/constants/colors';

// Safe import handling for react-native-audio-record
let AudioRecord: any = null;
try {
  AudioRecord = require('react-native-audio-record').default;
} catch (error) {
  console.warn('react-native-audio-record not available, using fallback mode');
}

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onTranscriptionStream?: (text: string) => void;
}

export default function VoiceRecorder({
  onTranscriptionComplete,
  onRecordingStateChange,
  onTranscriptionStream
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [streamingText, setStreamingText] = useState<string>('');
  const [partialTranscript, setPartialTranscript] = useState<string>('');
  const websocketRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAudioChunkRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
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
    if (AudioRecord) {
      const options = {
        sampleRate: 16000,  // 16kHz for Scribe v2 Realtime
        channels: 1,        // Mono
        bitsPerSample: 16,  // 16-bit PCM
        audioSource: 6,     // VOICE_COMMUNICATION
        wavFile: undefined, // No file output, we want raw data
      };

      AudioRecord.init(options);
      console.log('AudioRecord initialized for real-time streaming');
    } else {
      console.log('AudioRecord not available, using fallback mode');
    }
  }, []);

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
        console.log('WebSocket connected to ElevenLabs ScribeV2 Realtime');
        clearTimeout(connectionTimeoutRef.current!);
        setConnectionState('connected');
        setReconnectAttempts(0);
        websocketRef.current = ws;

        // Start heartbeat to keep connection alive
        startHeartbeat();

        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          // Don't close connection for parse errors, just log
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        clearTimeout(connectionTimeoutRef.current!);
        reject(error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        clearTimeout(connectionTimeoutRef.current!);
        stopHeartbeat();
        websocketRef.current = null;
        setConnectionState('disconnected');

        // Attempt reconnection if we were recording and it's not a normal close
        if (isRecording && event.code !== 1000 && reconnectAttempts < 3) {
          console.log(`Attempting reconnection (${reconnectAttempts + 1}/3)...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(true).catch(err => {
              console.error('Reconnection failed:', err);
            });
          }, Math.min(1000 * Math.pow(2, reconnectAttempts), 5000)); // Exponential backoff
        }
      };
    });
  };

  const startHeartbeat = () => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        // Send empty audio chunk to keep connection alive
        websocketRef.current.send(JSON.stringify({
          message_type: 'input_audio_chunk',
          audio_base_64: '',
          commit: false,
          sample_rate: 16000,
        }));
      }
    }, 30000); // Every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const handleWebSocketMessage = (data: any) => {
    try {
      switch (data.message_type) {
        case 'session_started':
          console.log('ElevenLabs session started:', data);
          break;

        case 'partial_transcript':
          const partialText = data.text || '';
          if (partialText.trim()) {
            setPartialTranscript(partialText);
            setStreamingText(partialText);
            onTranscriptionStream?.(partialText);
          }
          break;

        case 'committed_transcript':
          const committedText = data.text || '';
          console.log('Committed transcript:', committedText);
          if (committedText.trim()) {
            setStreamingText(committedText);
            onTranscriptionStream?.(committedText);
          }
          break;

        case 'committed_transcript_with_timestamps':
          // Handle timestamps if needed in future
          break;

        case 'error':
        case 'auth_error':
          console.error('ElevenLabs authentication error:', data);
          Alert.alert('Authentication Error', 'Please check your ElevenLabs API key configuration.');
          stopRecording();
          break;

        case 'quota_exceeded':
          console.error('ElevenLabs quota exceeded:', data);
          Alert.alert('Quota Exceeded', 'You have exceeded your ElevenLabs API quota. Please check your usage limits.');
          stopRecording();
          break;

        case 'transcriber_error':
          console.error('ElevenLabs transcription error:', data);
          // Try to continue with partial transcript if available
          if (partialTranscript.trim()) {
            console.log('Using partial transcript due to transcription error');
            onTranscriptionComplete(partialTranscript.trim());
          } else {
            Alert.alert('Transcription Error', 'Unable to transcribe audio. Please try again.');
          }
          stopRecording();
          break;

        case 'input_error':
          console.error('ElevenLabs input error:', data);
          Alert.alert('Audio Error', 'Invalid audio format. Please check your microphone settings.');
          stopRecording();
          break;

        default:
          console.log('Unknown message type:', data.message_type, data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone permission
      if (Platform.OS === 'ios') {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
          return;
        }
      }

      console.log('Starting real-time audio recording...');

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
        console.log('WebSocket connected successfully');
      } catch (wsError) {
        console.warn('WebSocket connection failed, falling back to file-based transcription:', wsError);
        wsConnected = false;
      }

      // Start AudioRecord for real-time streaming
      if (AudioRecord) {
        AudioRecord.start();

        // Set up audio data listener
        audioStreamRef.current = AudioRecord.on('data', (data: any) => {
          if (wsConnected && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            try {
              // Convert audio data to base64 and send to WebSocket
              const base64Audio = data.toString('base64');
              websocketRef.current.send(JSON.stringify({
                message_type: 'input_audio_chunk',
                audio_base_64: base64Audio,
                commit: false,
                sample_rate: 16000,
              }));
              lastAudioChunkRef.current = Date.now();
            } catch (error) {
              console.error('Error sending audio chunk:', error);
            }
          }
        });
      }

      setIsRecording(true);
      onRecordingStateChange?.(true);
      setStreamingText('');
      setPartialTranscript('');

      if (wsConnected) {
        console.log('Real-time recording and streaming started');
      } else {
        console.log('Recording started (fallback mode - no real-time transcription)');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      // Clean up on failure
      stopRecording();
    }
  };



  const transcribeWithFallback = async (audioUri: string) => {
    try {
      console.log('Using fallback transcription with regular ScribeV2 API');

      const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error('EXPO_PUBLIC_ELEVENLABS_API_KEY is not configured');
      }

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        formData.append('audio', blob, 'recording.webm');
      } else {
        const uriParts = audioUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const audioFile = {
          uri: audioUri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        } as any;
        formData.append('audio', audioFile);
      }

      const response = await fetch('https://api.elevenlabs.io/v1/scribe', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Fallback transcription failed: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.text) {
        const transcriptionText = data.text.trim();
        if (transcriptionText) {
          console.log('Fallback transcription successful:', transcriptionText);
          onTranscriptionComplete(transcriptionText);
        } else {
          throw new Error('Empty transcription from fallback API');
        }
      } else {
        throw new Error('Invalid response from fallback API');
      }
    } catch (error) {
      console.error('Fallback transcription failed:', error);
      Alert.alert('Transcription Error', 'Unable to transcribe audio. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    onRecordingStateChange?.(false);
    setIsProcessing(true);

    try {
      // Stop AudioRecord
      if (AudioRecord) {
        AudioRecord.stop();
      }

      // Remove audio data listener
      if (audioStreamRef.current) {
        audioStreamRef.current.remove();
        audioStreamRef.current = null;
      }

      const hasWebSocketConnection = websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN;
      const hasPartialTranscript = partialTranscript.trim().length > 0;

      if (hasWebSocketConnection) {
        // Send final commit to get the final transcript
        websocketRef.current.send(JSON.stringify({
          message_type: 'input_audio_chunk',
          audio_base_64: '',
          commit: true,
          sample_rate: 16000,
        }));

        // Wait for final transcript or timeout
        setTimeout(async () => {
          if (websocketRef.current) {
            websocketRef.current.close();
          }

          // Use partial transcript if available, otherwise try fallback
          if (hasPartialTranscript) {
            console.log('Using partial transcript from real-time session');
            onTranscriptionComplete(partialTranscript.trim());
          } else {
            console.log('No partial transcript available, attempting fallback transcription');
            // For fallback, we need to record the audio file
            // This is a simplified approach - in production you might want to buffer audio
            try {
              await audioRecorder.prepareToRecordAsync();
              await audioRecorder.record();
              // Record for a short time to capture what we missed
              setTimeout(async () => {
                await audioRecorder.stop();
                const uri = audioRecorder.uri;
                if (uri) {
                  await transcribeWithFallback(uri);
                }
                setIsProcessing(false);
              }, 1000);
            } catch (fallbackError) {
              console.error('Fallback recording failed:', fallbackError);
              setIsProcessing(false);
            }
          }
        }, 2000);
      } else {
        // No WebSocket connection, use fallback immediately
        console.log('No WebSocket connection, using fallback transcription');
        try {
          await audioRecorder.prepareToRecordAsync();
          await audioRecorder.record();
          setTimeout(async () => {
            await audioRecorder.stop();
            const uri = audioRecorder.uri;
            if (uri) {
              await transcribeWithFallback(uri);
            }
            setIsProcessing(false);
          }, 1000);
        } catch (fallbackError) {
          console.error('Fallback recording failed:', fallbackError);
          setIsProcessing(false);
        }
      }

      console.log('Recording stopped');
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to process recording.');
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
      console.log('Transcribing audio from:', uri);

      const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error('EXPO_PUBLIC_ELEVENLABS_API_KEY is not configured. Please add it to your .env file.');
      }

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

      // ElevenLabs ScribeV2 API (regular, not realtime)
      const sttResponse = await fetch('https://api.elevenlabs.io/v1/scribe', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData,
      });

      if (!sttResponse.ok) {
        const errorText = await sttResponse.text();
        console.error('ElevenLabs ScribeV2 API error:', sttResponse.status, errorText);
        throw new Error(`Transcription failed: ${sttResponse.status}`);
      }

      const data = await sttResponse.json();
      console.log('ElevenLabs ScribeV2 API response:', JSON.stringify(data, null, 2));

      // ElevenLabs ScribeV2 response format
      if (data && data.text) {
        const transcriptionText = data.text.trim();
        if (transcriptionText === '') {
          console.warn('Received empty transcription text');
          Alert.alert('No Speech Detected', 'No speech was detected in the recording. Please try again.');
        } else {
          setStreamingText(transcriptionText);
          onTranscriptionStream?.(transcriptionText);
          onTranscriptionComplete(transcriptionText);
        }
      } else {
        console.error('Invalid ElevenLabs response format:', data);
        throw new Error('No transcription text received from ElevenLabs');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
      setStreamingText('');
      setPartialTranscript('');
    }
  };



  const startStreamingSimulation = () => {
    setStreamingText('Listening...');
    onTranscriptionStream?.('Listening...');
  };

  const stopStreamingSimulation = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      // Clean up all resources
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

      stopHeartbeat();

      // Stop recording if active
      if (isRecording) {
        AudioRecord.stop();
      }
    };
  }, [isRecording]);

  // Monitor connection health
  useEffect(() => {
    if (connectionState === 'connected' && isRecording) {
      const healthCheck = setInterval(() => {
        if (websocketRef.current && websocketRef.current.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket connection lost during recording');
          setConnectionState('error');
        }
      }, 5000);

      return () => clearInterval(healthCheck);
    }
  }, [connectionState, isRecording]);

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {(isRecording || isProcessing) && (streamingText || partialTranscript) && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionText}>
            {partialTranscript || streamingText}
          </Text>
        </View>
      )}

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

      <TouchableOpacity
        onPress={handlePress}
        disabled={isProcessing}
        style={styles.recordButton}
        activeOpacity={0.8}
        testID="voiceRecorderButton"
      >
        <Animated.View
          style={[
            styles.recordButtonInner,
            isRecording && styles.recordButtonRecording,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {isProcessing ? (
            <Loader color="#FFFFFF" size={32} />
          ) : isRecording ? (
            <Square color="#FFFFFF" size={32} fill="#FFFFFF" />
          ) : (
            <Mic color="#FFFFFF" size={32} />
          )}
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.statusText}>
        {isProcessing
          ? 'Processing...'
          : isRecording
          ? connectionState === 'connected'
            ? 'Recording (Real-time)... Tap to stop'
            : 'Recording (Offline mode)... Tap to stop'
          : connectionState === 'connecting'
          ? 'Connecting...'
          : connectionState === 'error'
          ? 'Connection error - Tap to retry'
          : 'Tap to start recording'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 4,
    marginBottom: 20,
  },
  waveBar: {
    width: 4,
    height: 60,
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16,185,129,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonRecording: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600' as const,
  },
  transcriptionContainer: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    minHeight: 80,
    maxWidth: '90%',
  },
  transcriptionText: {
    color: '#D1FAE5',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
});
