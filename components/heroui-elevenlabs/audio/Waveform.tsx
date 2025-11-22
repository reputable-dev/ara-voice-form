"use client";

import React from "react";
import { View, Text } from "react-native";
import { Card } from "@heroui/react";

export interface WaveformProps {
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
   * @default 32
   */
  height?: number;

  /**
   * Color of the bars
   * @default "#007AFF"
   */
  color?: string;

  /**
   * Border radius of bars
   * @default 1
   */
  borderRadius?: number;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Whether to show background
   * @default true
   */
  showBackground?: boolean;

  /**
   * Background color
   * @default "transparent"
   */
  backgroundColor?: string;

  /**
   * Number of bars to render when no amplitudes provided
   * @default 20
   */
  defaultBarCount?: number;

  /**
   * Whether bars should be animated on load
   * @default false
   */
  animateOnLoad?: boolean;
}

/**
 * Static waveform visualization component for React Native
 * Displays audio waveform data as vertical bars
 */
export const Waveform: React.FC<WaveformProps> = ({
  amplitudes = [],
  barWidth = 2,
  barGap = 1,
  height = 32,
  color = "#007AFF",
  borderRadius = 1,
  className = "",
  showBackground = true,
  backgroundColor = "transparent",
  defaultBarCount = 20,
  animateOnLoad = false,
}) => {
  // Generate default waveform if no amplitudes provided
  const defaultAmplitudes = Array(defaultBarCount)
    .fill(0)
    .map((_, index) => {
      // Create a simple sine wave pattern
      const progress = index / defaultBarCount;
      return Math.abs(Math.sin(progress * Math.PI * 4)) * 0.8 + 0.2;
    });

  const waveformAmplitudes = amplitudes.length > 0 ? amplitudes : defaultAmplitudes;

  return (
    <Card 
      className={`items-center justify-center p-3 ${className}`}
      style={{
        backgroundColor: showBackground ? backgroundColor : "transparent",
      }}
    >
      <View 
        className="flex-row items-center justify-center"
        style={{ height }}
      >
        {waveformAmplitudes.map((amplitude, index) => (
          <View 
            key={index}
            style={{
              width: barWidth,
              height: Math.max(1, amplitude * height),
              marginHorizontal: barGap / 2,
              backgroundColor: color,
              borderRadius,
              opacity: animateOnLoad ? 0.8 + (amplitude * 0.2) : 1,
            }}
          />
        ))}
      </View>
    </Card>
  );
};

// Frequency spectrum visualization
export interface SpectrumProps {
  /**
   * Frequency bands data (0-1 values for each band)
   */
  bands?: number[];

  /**
   * Width of each band bar
   * @default 3
   */
  bandWidth?: number;

  /**
   * Gap between bands
   * @default 2
   */
  bandGap?: number;

  /**
   * Height of the spectrum container
   * @default 48
   */
  height?: number;

  /**
   * Color gradient from low to high frequency
   * @default ["#3B82F6", "#8B5CF6", "#EF4444"]
   */
  colors?: string[];

  /**
   * Custom className
   */
  className?: string;

  /**
   * Number of frequency bands
   * @default 16
   */
  bandCount?: number;
}

export const FrequencySpectrum: React.FC<SpectrumProps> = ({
  bands = [],
  bandWidth = 3,
  bandGap = 2,
  height = 48,
  colors = ["#3B82F6", "#8B5CF6", "#EF4444"],
  className = "",
  bandCount = 16,
}) => {
  // Generate random frequency data if none provided
  const defaultBands = Array(bandCount)
    .fill(0)
    .map(() => Math.random() * 0.8 + 0.2);

  const spectrumBands = bands.length > 0 ? bands : defaultBands;

  const getColorForBand = (index: number): string => {
    if (colors.length === 1) return colors[0];
    
    const progress = index / spectrumBands.length;
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
        style={{ height: height * 0.8 }}
      >
        {spectrumBands.map((amplitude, index) => (
          <View 
            key={index}
            style={{
              width: bandWidth,
              height: Math.max(2, amplitude * height),
              marginHorizontal: bandGap / 2,
              backgroundColor: getColorForBand(index),
              borderRadius: bandWidth / 2,
            }}
          />
        ))}
      </View>
    </Card>
  );
};

// Circular waveform/radial visualization
export interface RadialWaveformProps {
  /**
   * Array of amplitude values
   */
  amplitudes?: number[];

  /**
   * Radius of the circle
   * @default 40
   */
  radius?: number;

  /**
   * Thickness of the bars
   * @default 2
   */
  thickness?: number;

  /**
   * Color of the waveform
   * @default "#007AFF"
   */
  color?: string;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Number of radial segments
   * @default 32
   */
  segments?: number;

  /**
   * Whether to rotate the waveform
   * @default false
   */
  rotate?: boolean;
}

export const RadialWaveform: React.FC<RadialWaveformProps> = ({
  amplitudes = [],
  radius = 40,
  thickness = 2,
  color = "#007AFF",
  className = "",
  segments = 32,
  rotate = false,
}) => {
  const centerX = radius + 10; // Add padding
  const centerY = radius + 10;
  const totalSize = (radius + 10) * 2;

  // Generate default waveform if none provided
  const defaultAmplitudes = Array(segments)
    .fill(0)
    .map(() => Math.random() * 0.6 + 0.4);

  const waveformAmplitudes = amplitudes.length > 0 ? amplitudes : defaultAmplitudes;

  return (
    <Card className={`items-center justify-center ${className}`}>
      <View style={{ width: totalSize, height: totalSize }}>
        {waveformAmplitudes.map((amplitude, index) => {
          const angle = (index / segments) * Math.PI * 2;
          const barHeight = amplitude * radius;
          
          // Calculate start and end positions
          const startRadius = radius * 0.6; // Inner radius
          const endRadius = startRadius + barHeight;
          
          // Calculate positions
          const startX = centerX + Math.cos(angle) * startRadius;
          const startY = centerY + Math.sin(angle) * startRadius;
          const endX = centerX + Math.cos(angle) * endRadius;
          const endY = centerY + Math.sin(angle) * endRadius;

          // For simplicity, we'll render as small circles positioned radially
          const midX = centerX + Math.cos(angle) * ((startRadius + endRadius) / 2);
          const midY = centerY + Math.sin(angle) * ((startRadius + endRadius) / 2);

          return (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: midX - thickness / 2,
                top: midY - barHeight / 2,
                width: thickness,
                height: barHeight,
                backgroundColor: color,
                borderRadius: thickness / 2,
                opacity: 0.8,
                transform: [
                  { rotate: `${(angle * 180) / Math.PI + 90}deg` },
                  { translateX: 0 },
                  { translateY: 0 },
                ],
              }}
            />
          );
        })}
      </View>
    </Card>
  );
};

// Default waveform component for quick usage
export const DefaultWaveform: React.FC<Omit<WaveformProps, "amplitudes">> = (props) => {
  // Generate some sample amplitudes
  const sampleAmplitudes = Array(24)
    .fill(0)
    .map((_, index) => {
      const progress = index / 24;
      // Create more dynamic waveform pattern
      const wave1 = Math.sin(progress * Math.PI * 6) * 0.4;
      const wave2 = Math.sin(progress * Math.PI * 3) * 0.3;
      const noise = (Math.random() - 0.5) * 0.2;
      return Math.abs(wave1 + wave2 + noise) * 0.8 + 0.2;
    });

  return <Waveform {...props} amplitudes={sampleAmplitudes} />;
};

// Default export
export default Waveform;