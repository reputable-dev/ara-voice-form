"use client";

import React from "react";
import { View, Text } from "react-native";
import { Card } from "@heroui/react";

export interface BarVisualizerProps {
  /**
   * Array of frequency band values (0-1)
   */
  bars?: number[];

  /**
   * Width of each bar
   * @default 4
   */
  barWidth?: number;

  /**
   * Gap between bars
   * @default 2
   */
  barGap?: number;

  /**
   * Height of the visualizer container
   * @default 48
   */
  height?: number;

  /**
   * Color of the bars
   * @default "#007AFF"
   */
  color?: string;

  /**
   * Border radius of bars
   * @default 2
   */
  borderRadius?: number;

  /**
   * Whether to apply smoothing to animation
   * @default true
   */
  smoothing?: boolean;

  /**
   * Sensitivity for bar height variation
   * @default 1.0
   */
  sensitivity?: number;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Number of bars if no data provided
   * @default 16
   */
  barCount?: number;

  /**
   * Whether bars grow from center or bottom
   * @default "bottom"
   */
  growDirection?: "bottom" | "center";

  /**
   * Color gradient for bars
   * @default ["#3B82F6", "#8B5CF6", "#EF4444"]
   */
  colors?: string[];
}

/**
 * Bar frequency spectrum visualizer for React Native
 * Displays audio frequency bands as animated vertical bars
 */
export const BarVisualizer: React.FC<BarVisualizerProps> = ({
  bars = [],
  barWidth = 4,
  barGap = 2,
  height = 48,
  color = "#007AFF",
  borderRadius = 2,
  smoothing = true,
  sensitivity = 1.0,
  className = "",
  barCount = 16,
  growDirection = "bottom",
  colors = [],
}) => {
  // Generate random frequency data if none provided
  const defaultBars = Array(barCount)
    .fill(0)
    .map((_, index) => {
      // Create more realistic frequency distribution
      const position = index / barCount;
      // Lower frequencies tend to be louder
      const lowFreqBias = 1.0 - (position * 0.4);
      // Add some randomness
      const random = Math.random() * 0.7 + 0.3;
      return (random * sensitivity * lowFreqBias);
    });

  const visualizerBars = bars.length > 0 ? bars : defaultBars;

  const getColorForBar = (index: number): string => {
    if (colors.length === 0) return color;
    if (colors.length === 1) return colors[0];
    
    const progress = index / visualizerBars.length;
    const colorIndex = Math.min(
      Math.floor(progress * colors.length),
      colors.length - 1
    );
    
    return colors[colorIndex];
  };

  const getBarStyle = (amplitude: number, index: number) => {
    const barHeight = Math.max(2, amplitude * height);
    const barColor = getColorForBar(index);

    if (growDirection === "center") {
      return {
        width: barWidth,
        height: barHeight,
        marginHorizontal: barGap / 2,
        backgroundColor: barColor,
        borderRadius,
        position: 'absolute' as const,
        bottom: `${height / 2 - barHeight / 2}px`,
        transform: [{ translateY: 0 }],
      };
    }

    return {
      width: barWidth,
      height: barHeight,
      marginHorizontal: barGap / 2,
      backgroundColor: barColor,
      borderRadius,
    };
  };

  return (
    <Card className={`items-center justify-center p-3 ${className}`}>
      <View 
        className="flex-row items-end justify-center"
        style={{ height }}
      >
        {visualizerBars.map((amplitude, index) => (
          <View 
            key={index}
            style={getBarStyle(amplitude, index)}
          />
        ))}
      </View>
    </Card>
  );
};

// Animated bar visualizer with simulated real-time data
export interface AnimatedBarVisualizerProps {
  /**
   * Whether animation is active
   * @default true
   */
  active?: boolean;

  /**
   * Animation speed (lower = faster)
   * @default 100
   */
  animationSpeed?: number;

  /**
   * Number of bars
   * @default 16
   */
  barCount?: number;

  /**
   * Height of container
   * @default 48
   */
  height?: number;

  /**
   * Color configuration
   */
  colors?: string[];

  /**
   * Custom className
   */
  className?: string;
}

export const AnimatedBarVisualizer: React.FC<AnimatedBarVisualizerProps> = ({
  active = true,
  animationSpeed = 100,
  barCount = 16,
  height = 48,
  colors = ["#3B82F6", "#8B5CF6", "#EF4444"],
  className = "",
}) => {
  const [barHeights, setBarHeights] = React.useState<number[]>([]);

  // Initialize bar heights
  React.useEffect(() => {
    const initialHeights = Array(barCount)
      .fill(0)
      .map(() => Math.random() * 0.8 + 0.2);
    setBarHeights(initialHeights);
  }, [barCount]);

  // Animate bars when active
  React.useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setBarHeights(prevHeights => 
        prevHeights.map((_, index) => {
          const position = index / barCount;
          const lowFreqBias = 1.0 - (position * 0.4);
          const random = Math.random() * 0.7 + 0.3;
          return random * lowFreqBias;
        })
      );
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [active, animationSpeed, barCount]);

  if (barHeights.length === 0) {
    return (
      <Card className={`items-center justify-center p-3 ${className}`}>
        <View style={{ height }}>
          <Text className="text-muted-foreground text-sm">
            Loading visualizer...
          </Text>
        </View>
      </Card>
    );
  }

  const getColorForBar = (index: number): string => {
    if (colors.length === 1) return colors[0];
    
    const progress = index / barCount;
    const colorIndex = Math.min(
      Math.floor(progress * colors.length),
      colors.length - 1
    );
    
    return colors[colorIndex];
  };

  return (
    <Card className={`items-center justify-center p-3 ${className}`}>
      <View 
        className="flex-row items-end justify-center"
        style={{ height }}
      >
        {barHeights.map((amplitude, index) => (
          <View 
            key={index}
            style={{
              width: 4,
              height: Math.max(2, amplitude * height),
              marginHorizontal: 1,
              backgroundColor: getColorForBar(index),
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    </Card>
  );
};

// Minimal visualizer for quick usage
export interface MinimalVisualizerProps {
  /**
   * Whether visualizer is active
   * @default false
   */
  active?: boolean;

  /**
   * Number of bars
   * @default 8
   */
  barCount?: number;

  /**
   * Size of bars
   * @default "sm"
   */
  size?: "xs" | "sm" | "md" | "lg";

  /**
   * Custom className
   */
  className?: string;
}

export const MinimalVisualizer: React.FC<MinimalVisualizerProps> = ({
  active = false,
  barCount = 8,
  size = "sm",
  className = "",
}) => {
  const [barHeights, setBarHeights] = React.useState<number[]>([]);

  // Size configurations
  const sizeConfig = {
    xs: { width: 2, gap: 1, height: 24 },
    sm: { width: 3, gap: 1, height: 32 },
    md: { width: 4, gap: 2, height: 40 },
    lg: { width: 5, gap: 2, height: 48 },
  };

  const config = sizeConfig[size];

  // Initialize bar heights
  React.useEffect(() => {
    const initialHeights = Array(barCount)
      .fill(0)
      .map(() => active ? Math.random() * 0.8 + 0.2 : 0.2);
    setBarHeights(initialHeights);
  }, [active, barCount]);

  // Animate bars when active
  React.useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setBarHeights(prevHeights => 
        prevHeights.map(() => Math.random() * 0.8 + 0.2)
      );
    }, 150);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <View className={`flex-row items-center justify-center ${className}`}>
      <View 
        className="flex-row items-end justify-center"
        style={{ height: config.height }}
      >
        {barHeights.map((amplitude, index) => (
          <View 
            key={index}
            style={{
              width: config.width,
              height: Math.max(1, amplitude * config.height),
              marginHorizontal: config.gap / 2,
              backgroundColor: active ? "#007AFF" : "#D1D5DB",
              borderRadius: config.width / 2,
            }}
          />
        ))}
      </View>
    </View>
  );
};

// Default export
export default BarVisualizer;