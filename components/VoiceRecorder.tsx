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
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [streamingText, setStreamingText] = useState<string>('');
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
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

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
        return;
      }

      console.log('Preparing to record...');
      await audioRecorder.prepareToRecordAsync();
      
      console.log('Starting recording...');
      await audioRecorder.record();

      setIsRecording(true);
      onRecordingStateChange?.(true);
      setStreamingText('');
      startStreamingSimulation();
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    onRecordingStateChange?.(false);
    setIsProcessing(true);
    stopStreamingSimulation();

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

      const responseText = await sttResponse.text();
      console.log('STT API response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Invalid response from transcription service');
      }

      console.log('Transcription result:', data);
      console.log('Full data object:', JSON.stringify(data, null, 2));

      if (data.text && data.text.trim()) {
        setStreamingText(data.text);
        onTranscriptionStream?.(data.text);
        onTranscriptionComplete(data.text);
      } else if (data.text === '') {
        console.warn('Received empty transcription text');
        Alert.alert('No Speech Detected', 'No speech was detected in the recording. Please try again.');
      } else {
        console.error('No text field in response. Keys:', Object.keys(data));
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
      setStreamingText('');
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
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {(isRecording || isProcessing) && streamingText ? (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionText}>{streamingText}</Text>
        </View>
      ) : null}

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
          ? 'Recording... Tap to stop'
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
