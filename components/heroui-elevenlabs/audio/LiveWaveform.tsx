"use client";

import React, { useEffect, useRef, useState } from "react";
import { View, Animated, Dimensions } from "react-native";

export interface LiveWaveformProps {
  /**
   * Whether the waveform is actively recording/animating
   */
  active?: boolean;

  /**
   * Whether the waveform is in processing state
   */
  processing?: boolean;

  /**
   * Width of each bar
   * @default 2
   */
  barWidth?: number;

  /**
   * Gap between bars
   * @default 1
   */
  barGap?: number;

  /**
   * Border radius of bars
   * @default 4
   */
  barRadius?: number;

  /**
   * Fade edges animation
   * @default false
   */
  fadeEdges?: boolean;

  /**
   * Sensitivity for animation height variation
   * @default 1.8
   */
  sensitivity?: number;

  /**
   * Smoothing for animation transitions
   * @default 0.85
   */
  smoothingTimeConstant?: number;

  /**
   * Height of the waveform container
   * @default 20
   */
  height?: number;

  /**
   * Animation mode
   * @default "static"
   */
  mode?: "static" | "dynamic";

  /**
   * Custom className
   */
  className?: string;

  /**
   * Number of bars to display
   * @default 20
   */
  barCount?: number;

  /**
   * Color for active state
   */
  activeColor?: string;

  /**
   * Color for inactive state
   */
  inactiveColor?: string;

  /**
   * Color for processing state
   */
  processingColor?: string;
}

export const LiveWaveform: React.FC<LiveWaveformProps> = ({
  active = false,
  processing = false,
  barWidth = 2,
  barGap = 1,
  barRadius = 4,
  fadeEdges = false,
  sensitivity = 1.8,
  smoothingTimeConstant = 0.85,
  height = 20,
  mode = "static",
  className = "",
  barCount = 20,
  activeColor = "#007AFF",
  inactiveColor = "#D1D5DB",
  processingColor = "#10B981",
}) => {
  const animatedValues = useRef<Animated.Value[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize animated values
  useEffect(() => {
    animatedValues.current = Array(barCount).fill(0).map(() => new Animated.Value(0));
    setInitialized(true);
  }, [barCount]);

  // Animate waveform when active
  useEffect(() => {
    if (!initialized || !active) {
      // Reset bars to inactive height when not active
      if (initialized && animatedValues.current.length > 0) {
        animatedValues.current.forEach((value) => {
          value.setValue(0);
        });
      }
      return;
    }

    // Animation loop for active state
    const animationLoop = () => {
      const animations = animatedValues.current.map((value, index) => {
        // Create varying heights with some randomness
        const normalizedIndex = index / barCount;
        const centerBias = Math.sin(normalizedIndex * Math.PI);
        const randomFactor = Math.random() * sensitivity;
        const targetHeight = Math.max(0.2, centerBias * randomFactor);

        return Animated.timing(value, {
          toValue: targetHeight,
          duration: 100 + Math.random() * 100,
          useNativeDriver: false,
        });
      });

      Animated.parallel(animations).start(() => {
        // Continue animating when active
        if (active) {
          setTimeout(animationLoop, 50);
        }
      });
    };

    animationLoop();
  }, [active, initialized, barCount, sensitivity]);

  // Processing animation (gentle pulsing)
  useEffect(() => {
    if (!initialized || !processing || active) return;

    const pulseAnimation = () => {
      const animations = animatedValues.current.map((value, index) => {
        const normalizedIndex = index / barCount;
        const centerBias = Math.sin(normalizedIndex * Math.PI);
        const targetHeight = centerBias * 0.6;

        return Animated.sequence([
          Animated.timing(value, {
            toValue: targetHeight,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ]);
      });

      Animated.stagger(50, animations).start(() => {
        if (processing && !active) {
          setTimeout(pulseAnimation, 200);
        }
      });
    };

    pulseAnimation();
  }, [processing, active, initialized, barCount]);

  if (!initialized) {
    return (
      <View 
        className={`bg-gray-200 rounded ${className}`}
        style={{ height }}
      />
    );
  }

  // Determine bar color based on state
  const getBarColor = () => {
    if (processing && !active) return processingColor;
    if (active) return activeColor;
    return inactiveColor;
  };

  const barColor = getBarColor();

  return (
    <View 
      className={`flex-row items-center justify-center ${className}`}
      style={{ height }}
    >
      {animatedValues.current.map((animatedValue, index) => {
        // Calculate opacity for fade effect
        let opacity = 1;
        if (fadeEdges) {
          const normalizedIndex = index / barCount;
          const distanceFromCenter = Math.abs(normalizedIndex - 0.5) * 2;
          opacity = Math.max(0.3, 1 - distanceFromCenter * 0.8);
        }

        return (
          <View key={index} style={{ width: barWidth, marginHorizontal: barGap / 2 }}>
            <Animated.View
              className="rounded-full"
              style={{
                height: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, height],
                }),
                backgroundColor: barColor,
                borderRadius: barRadius,
                opacity,
                minHeight: 2,
              }}
            />
          </View>
        );
      })}
    </View>
  );
};

// Simpler static waveform component
export interface StaticWaveformProps {
  /**
   * Array of amplitude values (0-1)
   */
  amplitudes?: number[];

  /**
   * Width of each bar
   * @default 2
   */
  barWidth?: number;

  /**
   * Gap between bars
   * @default 1
   */
  barGap?: number;

  /**
   * Height of the waveform container
   * @default 20
   */
  height?: number;

  /**
   * Color of bars
   */
  color?: string;

  /**
   * Custom className
   */
  className?: string;
}

export const StaticWaveform: React.FC<StaticWaveformProps> = ({
  amplitudes = [],
  barWidth = 2,
  barGap = 1,
  height = 20,
  color = "#007AFF",
  className = "",
}) => {
  // Generate default waveform if no amplitudes provided
  const defaultAmplitudes = Array(20).fill(0).map(() => Math.random() * 0.8 + 0.2);
  const waveformAmplitudes = amplitudes.length > 0 ? amplitudes : defaultAmplitudes;

  return (
    <View 
      className={`flex-row items-center justify-center ${className}`}
      style={{ height }}
    >
      {waveformAmplitudes.map((amplitude, index) => (
        <View key={index} style={{ width: barWidth, marginHorizontal: barGap / 2 }}>
          <View
            className="rounded-full"
            style={{
              height: Math.max(2, amplitude * height),
              backgroundColor: color,
              borderRadius: barWidth / 2,
              minHeight: 2,
            }}
          />
        </View>
      ))}
    </View>
  );
};

// Default export for easier importing
export default LiveWaveform;