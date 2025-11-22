import React, { useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Mic, Square, Loader } from 'lucide-react-native';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import AudioRecord from 'react-native-audio-record';
import Colors from '@/constants/colors';
import LiveWaveform from '../audio/LiveWaveform';

export interface VoiceButtonProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onTranscriptionStream?: (text: string) => void;
  size?: 'small' | 'medium' | 'large';
  showWaveform?: boolean;
  showLabel?: boolean;
  disabled?: boolean;
  testID?: string;
}

const SIZES = {
  small: { button: 60, icon: 24, waveform: 40 },
  medium: { button: 80, icon: 32, waveform: 60 },
  large: { button: 100, icon: 40, waveform: 80 },
};

export default function VoiceButton({
  onTranscriptionComplete,
  onRecordingStateChange,
  onTranscriptionStream,
  size = 'medium',
  showWaveform = true,
  showLabel = true,
  disabled = false,
  testID = 'voice-button',
}: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [partialTranscript, setPartialTranscript] = useState<string>('');

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const sizeConfig = SIZES[size];

  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isRecording, pulseAnim, glowAnim]);

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;

      console.log('VoiceButton: Starting recording...');

      // Connect to ElevenLabs ScribeV2 Realtime
      const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
      if (!apiKey) {
        console.error('VoiceButton: No API key configured');
        return;
      }

      const wsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&audio_format=pcm_16000&include_timestamps=false`;

      const ws = new WebSocket(wsUrl, [], {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      ws.onopen = () => {
        console.log('VoiceButton: WebSocket connected');
        AudioRecord.start();
        setIsRecording(true);
        onRecordingStateChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.message_type) {
            case 'partial_transcript':
              if (data.text?.trim()) {
                setPartialTranscript(data.text.trim());
                onTranscriptionStream?.(data.text.trim());
              }
              break;

            case 'committed_transcript':
              if (data.text?.trim()) {
                onTranscriptionComplete(data.text.trim());
                stopRecording();
              }
              break;

            case 'error':
            case 'auth_error':
              console.error('VoiceButton: WebSocket error:', data);
              stopRecording();
              break;
          }
        } catch (error) {
          console.error('VoiceButton: Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('VoiceButton: WebSocket error:', error);
        stopRecording();
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

            // Update audio level for visualization
            setAudioLevel(Math.random() * 0.8 + 0.2);
          } catch (error) {
            console.error('VoiceButton: Error sending audio:', error);
          }
        }
      });

    } catch (error) {
      console.error('VoiceButton: Failed to start recording:', error);
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    console.log('VoiceButton: Stopping recording...');
    AudioRecord.stop();

    if (audioStreamRef.current) {
      audioStreamRef.current.remove();
      audioStreamRef.current = null;
    }

    if (websocketRef.current?.readyState === WebSocket.OPEN) {
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
    setPartialTranscript('');
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  return (
    <View style={styles.container} testID={testID}>
      {showWaveform && isRecording && (
        <View style={[styles.waveformContainer, { height: sizeConfig.waveform }]}>
          <LiveWaveform
            audioLevel={audioLevel}
            isActive={isRecording}
            barCount={15}
            barColor={Colors.light.tint}
            maxHeight={sizeConfig.waveform - 10}
          />
        </View>
      )}

      <TouchableOpacity
        onPressIn={startRecording}
        onPressOut={stopRecording}
        disabled={disabled || isProcessing}
        style={[
          styles.button,
          {
            width: sizeConfig.button,
            height: sizeConfig.button,
            borderRadius: sizeConfig.button / 2,
          },
        ]}
        activeOpacity={0.8}
        testID={`${testID}-button`}
      >
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: sizeConfig.button + 20,
              height: sizeConfig.button + 20,
              borderRadius: (sizeConfig.button + 20) / 2,
              opacity: glowOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.buttonInner,
            isRecording && styles.recordingButton,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {isProcessing ? (
            <Loader color="#FFFFFF" size={sizeConfig.icon} />
          ) : isRecording ? (
            <Square color="#FFFFFF" size={sizeConfig.icon} fill="#FFFFFF" />
          ) : (
            <Mic color="#FFFFFF" size={sizeConfig.icon} />
          )}
        </Animated.View>
      </TouchableOpacity>

      {showLabel && (
        <Text style={styles.label}>
          {isProcessing
            ? 'Processing...'
            : isRecording
            ? 'Recording... Release to stop'
            : 'Hold to speak'}
        </Text>
      )}

      {partialTranscript && isRecording && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptText}>{partialTranscript}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  waveformContainer: {
    width: '100%',
    marginBottom: 8,
  },
  button: {
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
  glowRing: {
    position: 'absolute',
    backgroundColor: Colors.light.tint,
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    opacity: 0.7,
  },
  transcriptContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    maxWidth: '90%',
  },
  transcriptText: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
  },
});
