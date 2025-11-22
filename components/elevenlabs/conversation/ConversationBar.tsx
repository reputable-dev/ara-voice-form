import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { Mic, Send, Square } from 'lucide-react-native';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import AudioRecord from 'react-native-audio-record';
import Colors from '@/constants/colors';
import LiveWaveform from '../audio/LiveWaveform';

export interface ConversationBarProps {
  onSendMessage: (message: string) => void;
  onVoiceTranscription?: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  showWaveform?: boolean;
  testID?: string;
}

export default function ConversationBar({
  onSendMessage,
  onVoiceTranscription,
  onRecordingStateChange,
  placeholder = 'Type a message or hold mic to speak...',
  disabled = false,
  showWaveform = true,
  testID = 'conversation-bar',
}: ConversationBarProps) {
  const [message, setMessage] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleSendMessage = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const startVoiceRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;

      console.log('ConversationBar: Starting voice recording...');

      // Connect to ElevenLabs ScribeV2 Realtime
      const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
      if (!apiKey) {
        console.error('ConversationBar: No ElevenLabs API key configured');
        return;
      }

      const wsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&audio_format=pcm_16000&include_timestamps=false`;

      const ws = new WebSocket(wsUrl, [], {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      ws.onopen = () => {
        console.log('ConversationBar: WebSocket connected');
        AudioRecord.start();
        setIsRecording(true);
        onRecordingStateChange?.(true);

        // Pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.message_type) {
            case 'partial_transcript':
              if (data.text?.trim()) {
                setMessage(data.text.trim());
              }
              break;

            case 'committed_transcript':
              if (data.text?.trim()) {
                const transcription = data.text.trim();
                setMessage(transcription);
                onVoiceTranscription?.(transcription);
                stopVoiceRecording();
              }
              break;

            case 'error':
            case 'auth_error':
            case 'quota_exceeded':
              console.error('ConversationBar: WebSocket error:', data);
              stopVoiceRecording();
              break;
          }
        } catch (error) {
          console.error('ConversationBar: Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('ConversationBar: WebSocket error:', error);
        stopVoiceRecording();
      };

      ws.onclose = () => {
        console.log('ConversationBar: WebSocket closed');
        stopVoiceRecording();
      };

      websocketRef.current = ws;

      // Set up audio streaming
      audioStreamRef.current = AudioRecord.on('data', (data: any) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            const base64Audio = data.toString('base64');
            ws.send(JSON.stringify({
              message_type: 'input_audio_chunk',
              audio_base_64: base64Audio,
              commit: false,
              sample_rate: 16000,
            }));

            // Simulate audio level (in real implementation, calculate from audio data)
            setAudioLevel(Math.random() * 0.8 + 0.2);
          } catch (error) {
            console.error('ConversationBar: Error sending audio chunk:', error);
          }
        }
      });

    } catch (error) {
      console.error('ConversationBar: Failed to start recording:', error);
      stopVoiceRecording();
    }
  };

  const stopVoiceRecording = () => {
    if (!isRecording) return;

    console.log('ConversationBar: Stopping recording...');

    // Stop audio recording
    AudioRecord.stop();

    // Remove audio listener
    if (audioStreamRef.current) {
      audioStreamRef.current.remove();
      audioStreamRef.current = null;
    }

    // Send final commit
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        message_type: 'input_audio_chunk',
        audio_base_64: '',
        commit: true,
        sample_rate: 16000,
      }));

      setTimeout(() => {
        websocketRef.current?.close();
        websocketRef.current = null;
      }, 1000);
    }

    setIsRecording(false);
    onRecordingStateChange?.(false);
    setAudioLevel(0);
    scaleAnim.stopAnimation();
    scaleAnim.setValue(1);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      testID={testID}
    >
      {showWaveform && isRecording && (
        <View style={styles.waveformContainer}>
          <LiveWaveform
            audioLevel={audioLevel}
            isActive={isRecording}
            barCount={20}
            barColor={Colors.light.tint}
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor="rgba(0, 0, 0, 0.4)"
          multiline
          maxLength={500}
          editable={!disabled && !isRecording}
          testID={`${testID}-input`}
        />

        <View style={styles.buttonsContainer}>
          {message.trim() ? (
            <TouchableOpacity
              onPress={handleSendMessage}
              style={[styles.button, styles.sendButton]}
              disabled={disabled}
              testID={`${testID}-send`}
            >
              <Send color="#FFFFFF" size={20} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPressIn={startVoiceRecording}
              onPressOut={stopVoiceRecording}
              style={[styles.button, isRecording && styles.recordingButton]}
              disabled={disabled || isProcessing}
              testID={`${testID}-voice`}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {isRecording ? (
                  <Square color="#FFFFFF" size={20} fill="#FFFFFF" />
                ) : (
                  <Mic color={Colors.light.tint} size={20} />
                )}
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  waveformContainer: {
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  sendButton: {
    backgroundColor: Colors.light.tint,
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
});
