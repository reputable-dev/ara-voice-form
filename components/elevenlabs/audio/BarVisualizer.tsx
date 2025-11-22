import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

export interface BarVisualizerProps {
  frequencyData?: number[]; // Array of frequency values (0-255)
  isActive: boolean;
  barCount?: number;
  barColor?: string;
  barWidth?: number;
  barGap?: number;
  minHeight?: number;
  maxHeight?: number;
  smoothing?: number; // 0-1, higher = smoother transitions
  testID?: string;
}

export default function BarVisualizer({
  frequencyData = [],
  isActive,
  barCount = 32,
  barColor = Colors.light.tint,
  barWidth = 4,
  barGap = 2,
  minHeight = 2,
  maxHeight = 100,
  smoothing = 0.7,
  testID = 'bar-visualizer',
}: BarVisualizerProps) {
  const barAnimsRef = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(minHeight))
  );
  const previousValuesRef = useRef<number[]>(Array(barCount).fill(minHeight));

  useEffect(() => {
    if (!isActive) {
      // Animate bars down to minimum
      barAnimsRef.current.forEach((anim, index) => {
        Animated.spring(anim, {
          toValue: minHeight,
          useNativeDriver: false,
          tension: 40,
          friction: 7,
        }).start();
      });
      previousValuesRef.current = Array(barCount).fill(minHeight);
      return;
    }

    // If no frequency data, create idle animation
    if (frequencyData.length === 0) {
      barAnimsRef.current.forEach((anim, index) => {
        const randomHeight = minHeight + Math.random() * (maxHeight - minHeight) * 0.3;
        const delay = index * 30;

        Animated.spring(anim, {
          toValue: randomHeight,
          delay,
          useNativeDriver: false,
          tension: 50,
          friction: 8,
        }).start();
      });
      return;
    }

    // Map frequency data to bar heights with smoothing
    const step = Math.max(1, Math.floor(frequencyData.length / barCount));

    barAnimsRef.current.forEach((anim, index) => {
      const dataIndex = Math.min(index * step, frequencyData.length - 1);
      const rawValue = frequencyData[dataIndex] || 0;

      // Normalize to 0-1 range (assuming frequency data is 0-255)
      const normalized = Math.min(rawValue / 255, 1);

      // Apply smoothing with previous value
      const previousValue = previousValuesRef.current[index];
      const smoothedValue = previousValue * smoothing + normalized * (1 - smoothing);
      previousValuesRef.current[index] = smoothedValue;

      // Calculate target height
      const targetHeight = minHeight + (maxHeight - minHeight) * smoothedValue;

      Animated.spring(anim, {
        toValue: targetHeight,
        useNativeDriver: false,
        tension: 60,
        friction: 8,
      }).start();
    });
  }, [frequencyData, isActive, barCount, minHeight, maxHeight, smoothing]);

  // Idle pulse animation when active but no data
  useEffect(() => {
    if (!isActive || frequencyData.length > 0) return;

    const pulseAnimations = barAnimsRef.current.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: minHeight + (maxHeight - minHeight) * 0.2,
            duration: 1000 + index * 40,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: minHeight,
            duration: 1000 + index * 40,
            useNativeDriver: false,
          }),
        ])
      );
    });

    pulseAnimations.forEach((animation) => animation.start());

    return () => {
      pulseAnimations.forEach((animation) => animation.stop());
    };
  }, [isActive, frequencyData, minHeight, maxHeight, barCount]);

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
                opacity: isActive ? 1 : 0.3,
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
    alignItems: 'flex-end',
    height: '100%',
  },
  bar: {
    borderRadius: 2,
  },
});
