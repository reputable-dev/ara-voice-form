"use client";

import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { Card } from "@heroui/react";

export interface AudioPlayerProps {
  /**
   * Audio source URL or local file path
   */
  source: string;

  /**
   * Whether audio should auto-play when loaded
   * @default false
   */
  autoPlay?: boolean;

  /**
   * Whether to show playback controls
   * @default true
   */
  showControls?: boolean;

  /**
   * Whether to show progress bar
   * @default true
   */
  showProgress?: boolean;

  /**
   * Whether to show time display
   * @default true
   */
  showTime?: boolean;

  /**
   * Whether to loop the audio
   * @default false
   */
  loop?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Callback when playback state changes
   */
  onPlaybackStateChange?: (isPlaying: boolean) => void;

  /**
   * Callback when time updates
   */
  onTimeUpdate?: (currentTime: number, duration: number) => void;

  /**
   * Callback when audio finishes
   */
  onPlaybackComplete?: () => void;

  /**
   * Audio volume (0.0 to 1.0)
   * @default 1.0
   */
  volume?: number;

  /**
   * Playback speed multiplier
   * @default 1.0
   */
  playbackRate?: number;

  /**
   * Whether player should be minimized
   * @default false
   */
  minimized?: boolean;

  /**
   * Whether to show loading state
   * @default true
   */
  showLoading?: boolean;
}

/**
 * React Native Audio Player component for React Native audio playback
 * Note: This is a basic implementation. In a production app, you would
 * integrate with react-native-sound or react-native-audio-toolkit for actual audio playback.
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  source,
  autoPlay = false,
  showControls = true,
  showProgress = true,
  showTime = true,
  loop = false,
  className = "",
  onPlaybackStateChange,
  onTimeUpdate,
  onPlaybackComplete,
  volume = 1.0,
  playbackRate = 1.0,
  minimized = false,
  showLoading = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(volume);
  const [error, setError] = useState<string | null>(null);

  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate audio playback for demo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1;
          
          if (newTime >= duration) {
            setIsPlaying(false);
            onPlaybackComplete?.();
            if (!loop) {
              return duration;
            } else {
              return 0;
            }
          }
          
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTime, duration, loop, onPlaybackComplete]);

  // Update progress animation
  useEffect(() => {
    const progress = duration > 0 ? currentTime / duration : 0;
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [currentTime, duration, progressAnimation]);

  // Update callbacks
  useEffect(() => {
    onPlaybackStateChange?.(isPlaying);
    onTimeUpdate?.(currentTime, duration);
  }, [isPlaying, currentTime, duration, onPlaybackStateChange, onTimeUpdate]);

  const handlePlayPause = () => {
    if (error) {
      // Retry playback
      setError(null);
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setDuration(30); // Simulated duration for demo
        setIsPlaying(true);
      }, 1000);
      return;
    }

    if (duration === 0) {
      // Simulate loading and setting duration
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setDuration(30); // Simulated duration for demo
        setIsPlaying(true);
      }, 1000);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkipBackward = () => {
    setCurrentTime(Math.max(0, currentTime - 10));
  };

  const handleSkipForward = () => {
    setCurrentTime(Math.min(duration, currentTime + 10));
  };

  const handleProgressPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const progress = locationX / (event.target.layout?.width || 100);
    setCurrentTime(progress * duration);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolumeLevel(newVolume);
    // In a real implementation, this would set the actual audio volume
  };

  if (minimized) {
    return (
      <Card className={`p-3 ${className}`}>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={handlePlayPause}>
            <Text className="text-xl">
              {isLoading ? "⏳" : isPlaying ? "⏸️" : "▶️"}
            </Text>
          </Pressable>
          
          <View className="flex-1">
            <Text className="text-sm text-muted-foreground truncate">
              {source}
            </Text>
            
            {showProgress && (
              <View className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                <Animated.View
                  style={{
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                    height: '100%',
                    backgroundColor: '#007AFF',
                  }}
                />
              </View>
            )}
          </View>
          
          {showTime && (
            <Text className="text-xs text-muted-foreground">
              {formatTime(currentTime)}
            </Text>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      {/* Error display */}
      {error && (
        <View className="mb-3 p-3 bg-danger/10 border border-danger/20 rounded-lg">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      )}

      {/* Source info */}
      <View className="mb-3">
        <Text className="text-sm text-muted-foreground truncate">
          {source}
        </Text>
      </View>

      {/* Progress bar */}
      {showProgress && (
        <View className="mb-3">
          <Pressable onPress={handleProgressPress}>
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <Animated.View
                style={{
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                  height: '100%',
                  backgroundColor: '#007AFF',
                }}
              />
            </View>
          </Pressable>
          
          {/* Time display */}
          {showTime && (
            <View className="flex-row justify-between mt-1">
              <Text className="text-xs text-muted-foreground">
                {formatTime(currentTime)}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {formatTime(duration)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Playback controls */}
      {showControls && (
        <View className="flex-row items-center justify-center gap-4">
          {/* Skip backward */}
          <Pressable onPress={handleSkipBackward}>
            <Text className="text-2xl text-muted-foreground">⏪</Text>
          </Pressable>

          {/* Play/Pause button */}
          <Pressable 
            onPress={handlePlayPause}
            className="w-12 h-12 bg-primary rounded-full items-center justify-center"
          >
            <Text className="text-white text-lg">
              {isLoading ? "⏳" : isPlaying ? "⏸️" : "▶️"}
            </Text>
          </Pressable>

          {/* Skip forward */}
          <Pressable onPress={handleSkipForward}>
            <Text className="text-2xl text-muted-foreground">⏩</Text>
          </Pressable>
        </View>
      )}

      {/* Additional controls */}
      {!minimized && (
        <View className="mt-4 pt-3 border-t border-border">
          <View className="flex-row items-center gap-3">
            <Text className="text-sm text-muted-foreground">Volume:</Text>
            <View className="flex-row items-center gap-2 flex-1">
              <Pressable onPress={() => handleVolumeChange(Math.max(0, volumeLevel - 0.1))}>
                <Text className="text-sm">🔉</Text>
              </Pressable>
              
              <View className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <View
                  style={{
                    width: `${volumeLevel * 100}%`,
                    height: '100%',
                    backgroundColor: '#007AFF',
                  }}
                />
              </View>
              
              <Pressable onPress={() => handleVolumeChange(Math.min(1, volumeLevel + 0.1))}>
                <Text className="text-sm">🔊</Text>
              </Pressable>
              
              <Text className="text-xs text-muted-foreground w-8">
                {Math.round(volumeLevel * 100)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Loading indicator */}
      {isLoading && showLoading && (
        <View className="mt-2">
          <Text className="text-muted-foreground text-sm text-center animate-pulse">
            Loading audio...
          </Text>
        </View>
      )}
    </Card>
  );
};

// Simplified player component for minimal display
export interface SimplePlayerProps {
  /**
   * Audio source
   */
  source: string;

  /**
   * Current playback state
   */
  isPlaying?: boolean;

  /**
   * Callback for play/press
   */
  onPlayPress?: () => void;

  /**
   * Progress (0.0 to 1.0)
   */
  progress?: number;

  /**
   * Current time in seconds
   */
  currentTime?: number;

  /**
   * Duration in seconds
   */
  duration?: number;

  /**
   * Custom className
   */
  className?: string;
}

export const SimpleAudioPlayer: React.FC<SimplePlayerProps> = ({
  source,
  isPlaying = false,
  onPlayPress,
  progress = 0,
  currentTime = 0,
  duration = 0,
  className = "",
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`p-3 ${className}`}>
      <View className="flex-row items-center gap-3">
        <Pressable onPress={onPlayPress}>
          <Text className="text-lg">
            {isPlaying ? "⏸️" : "▶️"}
          </Text>
        </Pressable>
        
        <View className="flex-1">
          <Text className="text-sm text-muted-foreground truncate">
            {source}
          </Text>
          
          <View className="h-1 bg-muted rounded-full overflow-hidden mt-1">
            <View
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                backgroundColor: '#007AFF',
              }}
            />
          </View>
        </View>
        
        <Text className="text-xs text-muted-foreground">
          {formatTime(currentTime)}
        </Text>
      </View>
    </Card>
  );
};

// Default export
export default AudioPlayer;