import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

export interface LiveWaveformProps {
  audioLevel: number; // 0.0 to 1.0
  isActive: boolean;
  barCount?: number;
  barColor?: string;
  barWidth?: number;
  barGap?: number;
  minHeight?: number;
  maxHeight?: number;
  testID?: string;
}

export default function LiveWaveform({
  audioLevel,
  isActive,
  barCount = 20,
  barColor = Colors.light.tint,
  barWidth = 3,
  barGap = 2,
  minHeight = 4,
  maxHeight = 40,
  testID = 'live-waveform',
}: LiveWaveformProps) {
  const barAnimsRef = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(minHeight))
  );

  useEffect(() => {
    if (!isActive) {
      // Reset to minimum height when inactive
      barAnimsRef.current.forEach((anim) => {
        Animated.timing(anim, {
          toValue: minHeight,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    // Animate bars based on audio level with wave effect
    const animations = barAnimsRef.current.map((anim, index) => {
      const delay = index * 20; // Stagger effect
      const randomVariation = Math.random() * 0.3 + 0.7; // 0.7-1.0 variation
      const targetHeight = minHeight + (maxHeight - minHeight) * audioLevel * randomVariation;

      return Animated.timing(anim, {
        toValue: targetHeight,
        duration: 100,
        delay,
        useNativeDriver: false,
      });
    });

    Animated.parallel(animations).start();
  }, [audioLevel, isActive, minHeight, maxHeight, barCount]);

  // Idle animation when active but no audio
  useEffect(() => {
    if (!isActive) return;

    const idleAnimations = barAnimsRef.current.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: minHeight + (maxHeight - minHeight) * 0.2,
            duration: 800 + index * 50,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: minHeight,
            duration: 800 + index * 50,
            useNativeDriver: false,
          }),
        ])
      );
    });

    // Start idle animation if audio level is very low
    if (audioLevel < 0.1) {
      idleAnimations.forEach((animation) => animation.start());
    }

    return () => {
      idleAnimations.forEach((animation) => animation.stop());
    };
  }, [isActive, audioLevel, minHeight, maxHeight]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.barsContainer}>
        {barAnimsRef.current.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: anim,
                backgroundColor: barColor,
                marginHorizontal: barGap / 2,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  bar: {
    borderRadius: 2,
  },
});
