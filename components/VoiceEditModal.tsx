import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface VoiceEditModalProps {
  visible: boolean;
  position: { x: number; y: number };
  transcriptionText: string;
  isRecording: boolean;
  isProcessing: boolean;
  animatedValue: Animated.Value;
}

export default function VoiceEditModal({
  visible,
  position,
  transcriptionText,
  isRecording,
  isProcessing,
  animatedValue,
}: VoiceEditModalProps) {
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
      waveAnims.forEach(anim => {
        anim.stopAnimation();
        anim.setValue(0.3);
      });
    }
  }, [isRecording, waveAnims]);

  if (!visible) return null;

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <Animated.View
      style={[
        styles.modalContainer,
        {
          top: position.y,
          left: position.x,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
      pointerEvents="none"
    >
      {Platform.OS !== 'web' ? (
        <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
          <View style={styles.modalContent}>
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
              <View style={styles.textContainer}>
                <Text style={styles.transcriptionText}>{transcriptionText}</Text>
              </View>
            )}
            
            <Text style={styles.statusText}>
              {isProcessing
                ? 'Processing...'
                : isRecording
                ? 'Speak now...'
                : 'Hold to edit'}
            </Text>
          </View>
        </BlurView>
      ) : (
        <View style={[styles.modalBlur, styles.webBlur]}>
          <View style={styles.modalContent}>
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
              <View style={styles.textContainer}>
                <Text style={styles.transcriptionText}>{transcriptionText}</Text>
              </View>
            )}
            
            <Text style={styles.statusText}>
              {isProcessing
                ? 'Processing...'
                : isRecording
                ? 'Speak now...'
                : 'Hold to edit'}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute' as const,
    width: 300,
    zIndex: 10000,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
      web: {
        filter: 'drop-shadow(0 4px 16px rgba(16, 185, 129, 0.4))',
      },
    }),
  },
  modalBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  webBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 4,
    marginBottom: 12,
  },
  waveBar: {
    width: 3,
    height: 30,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  textContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    width: '100%',
    minHeight: 40,
  },
  transcriptionText: {
    color: '#D1FAE5',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
});
