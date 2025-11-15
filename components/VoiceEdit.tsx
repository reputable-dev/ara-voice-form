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
import VoiceEditModal from './VoiceEditModal';

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
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const glowAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
    }).start();

    Animated.spring(modalAnim, {
      toValue: isLongPress ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [isLongPress, blurAnim, modalAnim]);

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
      Alert.alert('Error', 'Failed to process recording.');
      handleCancel();
    }
  };

  const transcribeAndEdit = async (uri: string) => {
    try {
      console.log('VoiceEdit: Transcribing from:', uri);
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

      const sttResponse = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
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

      const data = await sttResponse.json();
      console.log('VoiceEdit: Transcription result:', data);

      if (data.text) {
        setTranscriptionText(data.text);
        
        setTranscriptionText('Applying edit...');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const processedText = processEdit(value, data.text, fieldName);
        onValueChange(processedText);
        
        setTranscriptionText('Edit applied!');
        await new Promise(resolve => setTimeout(resolve, 1000));
        handleCancel();
      } else {
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('VoiceEdit: Error processing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process';
      if (errorMessage.includes('429')) {
        Alert.alert('Rate Limit', 'Too many requests. Please wait a moment and try again.');
      } else {
        Alert.alert('Error', 'Failed to process voice edit. Please try again.');
      }
      handleCancel();
    }
  };

  const processEdit = (currentValue: string, spokenText: string, field: string): string => {
    const lowerSpoken = spokenText.toLowerCase();
    
    if (lowerSpoken.includes('clear') || lowerSpoken.includes('delete') || lowerSpoken.includes('remove')) {
      return '';
    }
    
    if (lowerSpoken.includes('change to') || lowerSpoken.includes('set to') || lowerSpoken.includes('make it')) {
      const match = spokenText.match(/(?:change to|set to|make it)\s+(.+)/i);
      if (match) {
        return match[1].trim();
      }
    }
    
    if (lowerSpoken.includes('add') || lowerSpoken.includes('append')) {
      const match = spokenText.match(/(?:add|append)\s+(.+)/i);
      if (match) {
        return currentValue ? `${currentValue} ${match[1].trim()}` : match[1].trim();
      }
    }
    
    return spokenText;
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
          console.log('VoiceEdit: Long press detected');
          setIsLongPress(true);
          startRecording();
        }, 500);
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
          <BlurView intensity={blurAnim as any} style={StyleSheet.absoluteFill} tint="dark" />
        </View>
      )}
      
      {isLongPress && Platform.OS === 'web' && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: `rgba(0, 0, 0, ${blurAnim})`,
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
